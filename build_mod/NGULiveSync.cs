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
        private Timer _heartbeatTimer;
        private const int HEARTBEAT_INTERVAL_MS = 15000;

        void Awake() {
            var harmony = new Harmony("com.leonardo.ngu.livesync");
            harmony.PatchAll();
            _serverThread = new Thread(StartServer);
            _serverThread.IsBackground = true;
            _serverThread.Start();
            
            _heartbeatTimer = new Timer(SendHeartbeat, null, HEARTBEAT_INTERVAL_MS, HEARTBEAT_INTERVAL_MS);
            Logger.LogInfo("NGU Live Sync v1.3.0 loaded! Broadcasts driven by game saves.");
        }

        void OnDestroy() {
            try { _heartbeatTimer?.Dispose(); } catch { }
            try { _listener?.Stop(); } catch { }
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

                        string origin = req.Headers["Origin"];
                        if (!IsOriginAllowed(origin)) {
                            res.StatusCode = 403;
                            res.Close();
                            continue;
                        }

                        if (!string.IsNullOrEmpty(origin)) {
                            res.AddHeader("Access-Control-Allow-Origin", origin);
                        }
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
                            
                            byte[] ok = Encoding.UTF8.GetBytes(": connected\n\n");
                            res.OutputStream.Write(ok, 0, ok.Length);
                            res.OutputStream.Flush();

                            lock(_clients) { _clients.Add(res); }
                        } else { 
                            res.StatusCode = 404;
                            res.Close(); 
                        }
                    } catch (Exception ex) {
                        Logger.LogError("NGULiveSync: " + ex);
                    }
                }
            } catch (Exception ex) {
                Logger.LogError("NGULiveSync: " + ex);
            }
        }

        private static bool IsOriginAllowed(string origin) {
            if (string.IsNullOrEmpty(origin)) return true;
            if (origin.StartsWith("http://localhost:")) return true;
            if (origin.StartsWith("http://127.0.0.1:")) return true;
            if (origin == "https://postEntropy.github.io") return true;
            return false;
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
                            } catch (Exception ex) { 
                                Logger.LogError("NGULiveSync: " + ex);
                                try { _clients[i].Close(); } catch {}
                                _clients.RemoveAt(i); 
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                Logger.LogError("NGULiveSync: " + ex);
            }
        }

        private static void SendHeartbeat(object state) {
            byte[] ping = Encoding.UTF8.GetBytes(": ping\n\n");
            lock (_clients) {
                for (int i = _clients.Count - 1; i >= 0; i--) {
                    try {
                        _clients[i].OutputStream.Write(ping, 0, ping.Length);
                        _clients[i].OutputStream.Flush();
                    } catch {
                        try { _clients[i].Close(); } catch { }
                        _clients.RemoveAt(i);
                    }
                }
            }
        }
        private float _syncTimer = 0f;

        void Update() {
            if (Character != null && Character.importExport != null) {
                _syncTimer += Time.unscaledDeltaTime;
                // Force sync every 5 seconds independently of auto-saves
                if (_syncTimer >= 5f) {
                    _syncTimer = 0f;
                    try {
                        PlayerData pd = Character.importExport.gameStateToData();
                        BroadcastData(pd);
                    } catch { }
                }
            }
        }

        void OnGUI() {
            // Desenha um indicador bem discreto no canto superior esquerdo
            bool isConnected;
            lock (_clients) {
                isConnected = _clients.Count > 0;
            }

            GUIStyle style = new GUIStyle();
            if (isConnected) {
                style.normal.textColor = new Color(0f, 1f, 0f, 0.25f); // Verde translúcido (25% opacidade)
            } else {
                style.normal.textColor = new Color(1f, 0f, 0f, 0.15f); // Vermelho quase invisível (15% opacidade)
            }
            style.fontSize = 10;
            
            // "LS" = Live Sync
            GUI.Label(new Rect(2, 2, 50, 20), "LS", style);
        }
    }

    [HarmonyPatch(typeof(Character), "Start")]
    public static class Patch_Character_Start {
        static void Postfix(Character __instance) { LiveSyncPlugin.Character = __instance; }
    }
}
