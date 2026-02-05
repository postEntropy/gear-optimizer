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
    [BepInPlugin("com.leonardo.ngu.livesync", "NGU Live Sync", "1.0.0")]
    public class LiveSyncPlugin : BaseUnityPlugin {
        private static HttpListener _listener;
        private static List<HttpListenerResponse> _clients = new List<HttpListenerResponse>();
        private Thread _serverThread;
        public static Character Character; 

        void Awake() {
            var harmony = new Harmony("com.leonardo.ngu.livesync");
            harmony.PatchAll();
            _serverThread = new Thread(StartServer);
            _serverThread.IsBackground = true;
            _serverThread.Start();
            Logger.LogInfo("Live Sync Mod Loaded (v9)!");
        }

        void StartServer() {
            try {
                _listener = new HttpListener();
                _listener.Prefixes.Add("http://localhost:3005/");
                _listener.Start();
                while (_listener. IsListening) {
                    try {
                        var ctx = _listener.GetContext();
                        var res = ctx.Response;
                        res.AddHeader("Access-Control-Allow-Origin", "*");
                        res.AddHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                        if (ctx.Request.Url.AbsolutePath == "/events") {
                            res.ContentType = "text/event-stream";
                            res.Headers.Add("Cache-Control", "no-cache");
                            lock(_clients) { _clients.Add(res); }
                        } else { res.Close(); }
                    } catch {}
                }
            } catch {}
        }

        public static void BroadcastData() {
            try {
                if (Character != null) {
                    var pd = Character.importExport.gameStateToData();
                    if (pd != null) {
                        string json = JsonConvert.SerializeObject(pd);
                        byte[] data = Encoding.UTF8.GetBytes("data: " + json + "\n\n");
                        lock(_clients) {
                            for (int i = _clients.Count - 1; i >= 0; i--) {
                                try { _clients[i].OutputStream.Write(data, 0, data.Length); _clients[i].OutputStream.Flush(); }
                                catch { _clients.RemoveAt(i); }
                            }
                        }
                    }
                }
            } catch (Exception) { }
        }
    }

    [HarmonyPatch(typeof(Character), "Start")]
    public static class Patch_Character_Start {
        static void Postfix(Character __instance) { LiveSyncPlugin.Character = __instance; }
    }

    [HarmonyPatch(typeof(Character), "saveCharacter")]
    public static class Patch_Save {
        static void Postfix() { LiveSyncPlugin.BroadcastData(); }
    }
}
