$ErrorActionPreference = "Continue"

Write-Host "--- NGU Live Sync Compiler v9 (Fixed Syntax) ---"

# Caminhos
$managed = "C:\PROGRA~2\steam\steamapps\common\NGU Idle\NGUIdle_Data\Managed"
$bep = "C:\PROGRA~2\steam\steamapps\common\NGU Idle\BepInEx\core"
$out = Join-Path (Get-Location) "public\NGULiveSync.dll"
$csFile = Join-Path (Get-Location) "build_mod\NGULiveSync.cs"

if (!(Test-Path "build_mod")) { New-Item -ItemType Directory -Path "build_mod" }
if (Test-Path $out) { Remove-Item $out -Force }

Write-Host "Writing C# code..."

$code = @(
    "using System;",
    "using System.Net;",
    "using System.Text;",
    "using System.Threading;",
    "using System.Collections.Generic;",
    "using BepInEx;",
    "using Newtonsoft.Json;",
    "using HarmonyLib;",
    "using UnityEngine;",
    "",
    "namespace NGULiveSync {",
    "    [BepInPlugin(`"com.leonardo.ngu.livesync`", `"NGU Live Sync`", `"1.0.0`")]",
    "    public class LiveSyncPlugin : BaseUnityPlugin {",
    "        private static HttpListener _listener;",
    "        private static List<HttpListenerResponse> _clients = new List<HttpListenerResponse>();",
    "        private Thread _serverThread;",
    "        public static Character Character; ",
    "",
    "        void Awake() {",
    "            var harmony = new Harmony(`"com.leonardo.ngu.livesync`");",
    "            harmony.PatchAll();",
    "            _serverThread = new Thread(StartServer);",
    "            _serverThread.IsBackground = true;",
    "            _serverThread.Start();",
    "            Logger.LogInfo(`"Live Sync Mod Loaded (v9)!`");",
    "        }",
    "",
    "        void StartServer() {",
    "            try {",
    "                _listener = new HttpListener();",
    "                _listener.Prefixes.Add(`"http://localhost:3005/`");",
    "                _listener.Start();",
    "                while (_listener. IsListening) {",
    "                    try {",
    "                        var ctx = _listener.GetContext();",
    "                        var res = ctx.Response;",
    "                        res.AddHeader(`"Access-Control-Allow-Origin`", `"*`");",
    "                        res.AddHeader(`"Access-Control-Allow-Methods`", `"GET, OPTIONS`");",
    "                        if (ctx.Request.Url.AbsolutePath == `"/events`") {",
    "                            res.ContentType = `"text/event-stream`";",
    "                            res.Headers.Add(`"Cache-Control`", `"no-cache`");",
    "                            lock(_clients) { _clients.Add(res); }",
    "                        } else { res.Close(); }",
    "                    } catch {}",
    "                }",
    "            } catch {}",
    "        }",
    "",
    "        public static void BroadcastData() {",
    "            try {",
    "                if (Character != null) {",
    "                    var pd = Character.importExport.gameStateToData();",
    "                    if (pd != null) {",
    "                        string json = JsonConvert.SerializeObject(pd);",
    "                        byte[] data = Encoding.UTF8.GetBytes(`"data: `" + json + `"\n\n`");",
    "                        lock(_clients) {",
    "                            for (int i = _clients.Count - 1; i >= 0; i--) {",
    "                                try { _clients[i].OutputStream.Write(data, 0, data.Length); _clients[i].OutputStream.Flush(); }",
    "                                catch { _clients.RemoveAt(i); }",
    "                            }",
    "                        }",
    "                    }",
    "                }",
    "            } catch (Exception) { }",
    "        }",
    "    }",
    "",
    "    [HarmonyPatch(typeof(Character), `"Start`")]",
    "    public static class Patch_Character_Start {",
    "        static void Postfix(Character __instance) { LiveSyncPlugin.Character = __instance; }",
    "    }",
    "",
    "    [HarmonyPatch(typeof(Character), `"saveCharacter`")]",
    "    public static class Patch_Save {",
    "        static void Postfix() { LiveSyncPlugin.BroadcastData(); }",
    "    }",
    "}"
)
$code | Out-File -FilePath $csFile -Encoding UTF8

Write-Host "Compiling..."
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$refs = @(
    "/r:`"$managed\UnityEngine.dll`"",
    "/r:`"$managed\UnityEngine.CoreModule.dll`"",
    "/r:`"$managed\Assembly-CSharp.dll`"",
    "/r:`"$managed\Assembly-CSharp-firstpass.dll`"",
    "/r:`"$bep\BepInEx.dll`"",
    "/r:`"$bep\0Harmony.dll`"",
    "/r:System.dll",
    "/r:System.Core.dll"
)

$json = "C:\Users\Leonardo\.nuget\packages\newtonsoft.json\10.0.3\lib\net20\Newtonsoft.Json.dll"
if (!(Test-Path $json)) { $json = "C:\Users\Leonardo\.nuget\packages\newtonsoft.json\13.0.1\lib\net45\Newtonsoft.Json.dll" }
if (Test-Path $json) { $refs += "/r:`"$json`"" }

$args = @("/target:library", "/out:`"$out`"") + $refs + "`"$csFile`""

Start-Process -FilePath $csc -ArgumentList $args -Wait -NoNewWindow

if (Test-Path $out) {
    Write-Host "✅ SUCESSO! DLL gerada com sucesso em: $out" -ForegroundColor Green
}
else {
    Write-Host "❌ Falha na compilação." -ForegroundColor Red
}
pause
