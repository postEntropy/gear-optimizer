using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using BepInEx;
using Newtonsoft.Json;
using HarmonyLib;
using UnityEngine;

namespace NGULiveSync {
    [BepInPlugin("com.leonardo.ngu.livesync", "NGU Live Sync", "1.2.0")]
    public class LiveSyncPlugin : BaseUnityPlugin {
        private static HttpListener _listener;
        private static List<HttpListenerResponse> _clients = new List<HttpListenerResponse>();
        private Thread _serverThread;
        public static Character Character;
        private static float _lastBroadcastTime = -999f;
        private const float DEBOUNCE_SECONDS = 5f;

        void Awake() {
            var harmony = new Harmony("com.leonardo.ngu.livesync");
            harmony.PatchAll();
            _serverThread = new Thread(StartServer);
            _serverThread.IsBackground = true;
            _serverThread.Start();
            Logger.LogInfo("NGU Live Sync v1.2.0 loaded! Broadcasts driven by game saves.");
        }

        void StartServer() {
            try {
                _listener = new HttpListener();
                _listener.Prefixes.Add("http://localhost:3005/");
                _listener.Start();
                while (_listener.IsListening) {
                    try {
                        var ctx = _listener.GetContext();
                        var req = ctx.Request;
                        var res = ctx.Response;

                        res.AddHeader("Access-Control-Allow-Origin", "*");
                        res.AddHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                        res.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
                        res.AddHeader("Access-Control-Max-Age", "3600");

                        if (req.HttpMethod == "OPTIONS") {
                            res.StatusCode = 200;
                            res.Close();
                            continue;
                        }

                        if (req.Url.AbsolutePath == "/events") {
                            res.ContentType = "text/event-stream";
                            res.Headers.Add("Cache-Control", "no-cache");
                            res.Headers.Add("Connection", "keep-alive");
                            
                            byte[] ok = Encoding.UTF8.GetBytes(": ok\n\n");
                            res.OutputStream.Write(ok, 0, ok.Length);
                            res.OutputStream.Flush();

                            lock(_clients) { _clients.Add(res); }
                        } else { 
                            res.StatusCode = 404;
                            res.Close(); 
                        }
                    } catch { }
                }
            } catch { }
        }

        public static void BroadcastData(PlayerData pd) {
            try {
                if (pd == null) return;
                // Debounce: ignore if last broadcast was less than DEBOUNCE_SECONDS ago
                float now = Time.unscaledTime;
                if (now - _lastBroadcastTime < DEBOUNCE_SECONDS) return;
                _lastBroadcastTime = now;
                {
                    string base64Str = "";
                    using (System.IO.MemoryStream ms = new System.IO.MemoryStream()) {
                        System.Runtime.Serialization.Formatters.Binary.BinaryFormatter bf = new System.Runtime.Serialization.Formatters.Binary.BinaryFormatter();
                        bf.Serialize(ms, pd);
                        base64Str = Convert.ToBase64String(ms.ToArray());
                    }
                    byte[] data = Encoding.UTF8.GetBytes("data: " + base64Str + "\n\n");
                    lock(_clients) {
                        for (int i = _clients.Count - 1; i >= 0; i--) {
                            try { 
                                _clients[i].OutputStream.Write(data, 0, data.Length); 
                                _clients[i].OutputStream.Flush(); 
                            } catch { 
                                try { _clients[i].Close(); } catch {}
                                _clients.RemoveAt(i); 
                            }
                        }
                    }
                }
            } catch { }
        }
    }

    [HarmonyPatch(typeof(Character), "Start")]
    public static class Patch_Character_Start {
        static void Postfix(Character __instance) { LiveSyncPlugin.Character = __instance; }
    }

    [HarmonyPatch(typeof(ImportExport), "gameStateToData")]
    public static class Patch_Save {
        static void Postfix(PlayerData __result) {
            LiveSyncPlugin.BroadcastData(__result);
        }
    }
}
