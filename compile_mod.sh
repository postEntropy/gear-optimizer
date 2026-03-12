#!/usr/bin/env bash
# compile_mod.sh — Compila NGULiveSync.dll no Linux (Fedora/etc) via dotnet SDK
# 
# Uso:
#   ./compile_mod.sh
#   ./compile_mod.sh --game-dir "/path/para/NGU IDLE"
# 
# Dependências:
#   - dotnet SDK >= 6.0 instalado  (sudo dnf install dotnet-sdk-8.0)
#   - NGU Idle com BepInEx instalado no diretório do Steam
#   - Newtonsoft.Json.dll copiado para BepInEx/plugins/ do jogo

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

# ── 1. Detecta GameDir ─────────────────────────────────────────────────────────
GAME_DIR=""

# Flag manual
if [[ "${1:-}" == "--game-dir" && -n "${2:-}" ]]; then
    GAME_DIR="$2"
fi

# Auto-detect: tentativas comuns de instalação Steam
if [[ -z "$GAME_DIR" ]]; then
    CANDIDATES=(
        "$HOME/.local/share/Steam/steamapps/common/NGU IDLE"
        "$HOME/.steam/steam/steamapps/common/NGU IDLE"
        "$HOME/.var/app/com.valvesoftware.Steam/.steam/steam/steamapps/common/NGU IDLE"
    )
    for dir in "${CANDIDATES[@]}"; do
        if [[ -d "$dir" && -d "$dir/BepInEx" ]]; then
            GAME_DIR="$dir"
            break
        fi
    done
fi

if [[ -z "$GAME_DIR" ]]; then
    echo ""
    echo "❌  Não encontrei o diretório do NGU IDLE automaticamente."
    echo "    Por favor, informe o caminho manualmente:"
    echo "      ./compile_mod.sh --game-dir \"/caminho/para/NGU IDLE\""
    exit 1
fi

echo "🎮  Game dir: $GAME_DIR"

# ── 2. Verifica DLLs críticas ──────────────────────────────────────────────────
REQUIRED_DLLS=(
    "$GAME_DIR/BepInEx/core/BepInEx.dll"
    "$GAME_DIR/BepInEx/core/0Harmony.dll"
    "$GAME_DIR/NGUIdle_Data/Managed/UnityEngine.CoreModule.dll"
    "$GAME_DIR/NGUIdle_Data/Managed/Assembly-CSharp.dll"
)

for dll in "${REQUIRED_DLLS[@]}"; do
    if [[ ! -f "$dll" ]]; then
        echo "❌  DLL não encontrada: $dll"
        echo "    Verifique se o BepInEx está instalado no NGU IDLE."
        exit 1
    fi
done
echo "✅  DLLs de referência encontradas."

# ── 3. Newtonsoft.Json.dll ─────────────────────────────────────────────────────
NEWTON_SRC="$GAME_DIR/BepInEx/plugins/Newtonsoft.Json.dll"
if [[ ! -f "$NEWTON_SRC" ]]; then
    # Tenta achar em outro lugar dentro do BepInEx
    NEWTON_SRC=$(find "$GAME_DIR/BepInEx" -name "Newtonsoft.Json.dll" 2>/dev/null | head -1)
fi

if [[ -z "$NEWTON_SRC" || ! -f "$NEWTON_SRC" ]]; then
    echo "⚠️   Newtonsoft.Json.dll não encontrada no BepInEx."
    echo "    Coloque o Newtonsoft.Json.dll em: $GAME_DIR/BepInEx/plugins/"
    echo "    (Pode baixar de: https://www.nuget.org/packages/Newtonsoft.Json)"
    exit 1
fi
echo "✅  Newtonsoft.Json.dll: $NEWTON_SRC"

# ── 4. Verifica dotnet ─────────────────────────────────────────────────────────
if ! command -v dotnet &>/dev/null; then
    echo ""
    echo "❌  dotnet SDK não encontrado."
    echo "    Instale com:"
    echo "      sudo dnf install dotnet-sdk-8.0"
    exit 1
fi
echo "✅  dotnet: $(dotnet --version)"

# ── 5. Compila ─────────────────────────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"
echo ""
echo "🔨  Compilando NGULiveSync..."
cd "$SCRIPT_DIR/build_mod"

dotnet build NGULiveSync.csproj \
    --configuration Release \
    /p:GameDir="$GAME_DIR" \
    /p:Newtonsoft_DLL="$NEWTON_SRC" \
    -o "$OUTPUT_DIR" \
    2>&1

# ── 6. Copia o .dll para BepInEx/plugins ─────────────────────────────────────
PLUGINS_DIR="$GAME_DIR/BepInEx/plugins"
DLL_SRC="$OUTPUT_DIR/NGULiveSync.dll"

if [[ -f "$DLL_SRC" ]]; then
    cp "$DLL_SRC" "$PLUGINS_DIR/NGULiveSync.dll"
    echo ""
    echo "✅  NGULiveSync.dll copiado para:"
    echo "    $PLUGINS_DIR/NGULiveSync.dll"
    echo ""
    echo "🚀  Pronto! Abra o NGU IDLE com BepInEx para ativar o mod."
else
    echo ""
    echo "❌  Build falhou — $DLL_SRC não encontrado."
    exit 1
fi
