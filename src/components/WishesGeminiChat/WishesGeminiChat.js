import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Button, TextField, Typography, Paper, CircularProgress,
    IconButton, Divider, Chip, alpha, useTheme, Collapse, Tooltip,
    Link
} from '@mui/material';
import {
    AutoAwesome as GeminiIcon,
    Send as SendIcon,
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ContentCopy as CopyIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Wishes } from '../../assets/ItemAux';
import { toTime, shortenExponential } from '../../util';

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Speed divider constants (from NGU Idle game mechanics)
const TICKS_PER_SECOND = 50;
const TICKS_PER_MINUTE = TICKS_PER_SECOND * 60;
const TICKS_PER_HOUR = TICKS_PER_MINUTE * 60;
const TICKS_PER_DAY = TICKS_PER_HOUR * 24;

function buildSystemPrompt(wishstats, liveSync, optimizerResults) {
    const { scores, assignments, remaining } = optimizerResults;

    // Build wish list context
    const wishList = Wishes.map((w, i) =>
        `  [${i}] "${w[0]}" — base cost: ${w[1].toExponential(2)}, max level: ${w[2]}`
    ).join('\n');

    // Build current configuration context
    const currentWishes = (wishstats.wishes || []).map((w, i) => {
        const name = Wishes[w.wishidx] ? Wishes[w.wishidx][0] : `Wish #${w.wishidx}`;
        const score = scores && scores[i] != null ? toTime(scores[i]) : 'N/A';
        const asgn = assignments && assignments[i]
            ? `E: ${shortenExponential(assignments[i][0])}, M: ${shortenExponential(assignments[i][1])}, R3: ${shortenExponential(assignments[i][2])}`
            : 'N/A';
        return `  • "${name}" (idx ${w.wishidx}): level ${w.start} → ${w.goal} | time: ${score} | resources: ${asgn}`;
    }).join('\n');

    // Remaining resources
    const rem = remaining
        ? `E: ${shortenExponential(remaining[0])}, M: ${shortenExponential(remaining[1])}, R3: ${shortenExponential(remaining[2])}`
        : 'N/A';

    // Live sync context
    const liveStatus = liveSync
        ? `Status: ${liveSync.status || 'disconnected'} | Updates received: ${liveSync.updateCount || 0} | Last update: ${liveSync.lastUpdate ? new Date(liveSync.lastUpdate).toLocaleTimeString() : 'never'}`
        : 'Not connected';

    const recentLogs = liveSync && liveSync.logs && liveSync.logs.length > 0
        ? liveSync.logs.slice(-5).map(l => `  [${l.ok ? '✓' : '✗'}] ${l.label}${l.detail ? ': ' + l.detail : ''}`).join('\n')
        : '  (no recent sync events)';

    // Potions active
    const pots = [];
    ['e', 'm', 'r'].forEach(r => {
        if (wishstats[`${r}BetaPot`]) pots.push(`${r.toUpperCase()} Beta Potion (+100% speed)`);
        if (wishstats[`${r}DeltaPot`]) pots.push(`${r.toUpperCase()} Delta Potion (+200% speed)`);
        if (wishstats[`${r}cBetaPot`]) pots.push(`${r.toUpperCase()} Cap Beta Potion`);
        if (wishstats[`${r}cDeltaPot`]) pots.push(`${r.toUpperCase()} Cap Delta Potion`);
    });

    const resourcePriorities = [
        'Magic > Energy > R3', 'Magic > R3 > Energy', 'R3 > Magic > Energy',
        'Energy > Magic > R3', 'R3 > Energy > Magic', 'Energy > R3 > Magic'
    ];
    const sparePolicies = ['None', 'Equal distribution', 'Cheapest wish first'];

    return `You are an expert assistant for the game NGU Idle, specializing in the Wishes system. You have deep knowledge of the game mechanics, formulas, and optimization strategies.

## NGU Idle Wishes — Game Mechanics & Formula

### Core Concept
Wishes are long-term upgrades that cost Energy, Magic, and Resource 3 (R3). Each wish has multiple levels and the cost per level increases.

### Wish Time Formula (from the NGU Idle wiki)
The time (in game ticks) to complete one level of a wish is:

  ticks_for_level_i = max(wishcap_ticks, base_cost × level_i / max_level × (E_power × M_power × R3_power)^(-0.17) × (E_cap × M_cap × R3_cap)^(-0.17) / wish_speed)

Where:
- **base_cost**: the wish's base cost (varies per wish, see list below)
- **level_i**: current level being completed (1..max_level)
- **max_level**: maximum level for that wish
- **E/M/R3_power**: Energy, Magic, Resource 3 power stats
- **E/M/R3_cap**: the amount of cap allocated to this wish
- **wish_speed**: speed modifier from items + potions
- **wishcap_ticks**: minimum time per level = wishcap_minutes × 60 × ${TICKS_PER_SECOND} ticks

The **exponent is -0.17**, meaning:
  cost_factor = base_cost × (all_resources_product)^(-0.17)

Total ticks to complete start→goal levels:
  total_ticks = Σ(i = start+1 to goal) max(wishcap_ticks, cost_factor / max_level × i)

### Speed Divider Constants
- Game tick rate: **${TICKS_PER_SECOND} ticks/second**
- 1 minute = ${TICKS_PER_MINUTE} ticks
- 1 hour = ${TICKS_PER_HOUR} ticks
- 1 day = ${TICKS_PER_DAY} ticks

### Resource Allocation Impact
All three resources (E, M, R3) multiply together for the power product and cap product. The combined product is raised to the -0.17 exponent, which means:
- Doubling ALL resources reduces time by 2^(3×0.17) ≈ 12%
- Resources are somewhat interchangeable but the optimizer finds the best split
- The "cap" is how much of your resource cap you dedicate to wishes per tick cycle

### Precision Loss ("True Time")
At very high wish costs, the game uses 32-bit float arithmetic internally. Progress per tick (1/total_ticks) can round to 0 in float32 if ticks > ~16 million, causing the wish to never complete. This is shown by the "Wish time estimation" feature.

### Wish Speed Modifiers
- Items with WISH_SPEED stat multiply the base speed
- Beta potions: ×2 speed for each resource
- Delta potions: ×3 speed for each resource
- Blue Heart perk: additional speed bonus

---

## Complete Wish List (index, name, base cost, max level)
${wishList}

---

## Current Player Configuration (from Live Sync / manual input)

### Resources
- Energy: power=${wishstats.epow}, cap=${wishstats.ecap}, use=${wishstats.epct}%
- Magic:  power=${wishstats.mpow}, cap=${wishstats.mcap}, use=${wishstats.mpct}%
- R3:     power=${wishstats.rpow}, cap=${wishstats.rcap}, use=${wishstats.rpct}%

### Wish Settings
- Wish Speed Modifier: ${wishstats.wishspeed}
- Wish Cap (min/level): ${wishstats.wishcap} minutes = ${(wishstats.wishcap * TICKS_PER_MINUTE).toExponential(3)} ticks
- Resource Priority: ${resourcePriorities[wishstats.rp_idx] || wishstats.rp_idx}
- Spare Resource Policy: ${sparePolicies[wishstats.spare_policy] || wishstats.spare_policy}
- Equal Resources Mode: ${wishstats.equalResources ? 'ON' : 'OFF'}
- True Time Estimation: ${wishstats.trueTime ? 'ON' : 'OFF'}
- Active Potions: ${pots.length > 0 ? pots.join(', ') : 'None'}

### Current Wish Targets & Optimizer Results
${currentWishes || '  (no wishes configured)'}

Remaining unallocated resources after optimization:
  ${rem}

---

## Live Sync Status (NGULiveSync BepInEx mod)
${liveStatus}
Recent sync events:
${recentLogs}

---

## Your Role
You help the player understand:
1. Whether their current wish configuration is optimal
2. Which wishes to prioritize given their current resources
3. How long things will take in real time
4. What resources they need to reach specific goals
5. How potions, speed modifiers, and cap affect completion time
6. Precision loss issues and how to work around them
7. Strategy for progressing through wish pages

Always convert ticks to human-readable time when answering (e.g., "2d 5h 30m"). Be specific, use the actual numbers from the player's configuration when answering questions.`;
}

function MessageBubble({ msg, theme }) {
    const [copied, setCopied] = useState(false);
    const isUser = msg.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(msg.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 1.5,
                gap: 1
            }}
        >
            {!isUser && (
                <GeminiIcon sx={{ color: theme.palette.primary.main, mt: 0.5, flexShrink: 0, fontSize: 20 }} />
            )}
            <Box sx={{ maxWidth: '85%', position: 'relative' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: isUser
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(isUser ? theme.palette.primary.main : theme.palette.divider, 0.2)}`,
                        position: 'relative'
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            pr: 2
                        }}
                    >
                        {msg.text}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                        <IconButton
                            size="small"
                            onClick={handleCopy}
                            sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                opacity: 0.4,
                                '&:hover': { opacity: 1 },
                                p: 0.3
                            }}
                        >
                            <CopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                </Paper>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.3, textAlign: isUser ? 'right' : 'left', px: 0.5 }}>
                    {isUser ? 'You' : 'Gemini AI'}
                </Typography>
            </Box>
        </Box>
    );
}

export default function WishesGeminiChat({ wishstats, liveSync, optimizerResults, geminiApiKey, defaultOpen = false, fullPage = false }) {
    const theme = useTheme();
    const [open, setOpen] = useState(defaultOpen || fullPage);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const systemPrompt = buildSystemPrompt(wishstats, liveSync, optimizerResults);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        if (!geminiApiKey) {
            setError('No Gemini API key configured. Please add your key in Settings → Profile & AI.');
            return;
        }

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setError(null);

        // Build conversation history for Gemini API
        // First message includes the full system prompt prepended to user message
        const contents = newMessages.map((m, idx) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{
                text: idx === 0 && m.role === 'user'
                    ? `${systemPrompt}\n\n---\n\nPlayer question: ${m.text}`
                    : m.text
            }]
        }));

        try {
            const response = await fetch(
                `${GEMINI_API_URL}?key=${encodeURIComponent(geminiApiKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048
                        }
                    })
                }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiText) throw new Error('Empty response from Gemini API.');

            setMessages(prev => [...prev, { role: 'model', text: aiText }]);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    const hasKey = !!geminiApiKey;

    return (
        <Box sx={{ mt: fullPage ? 0 : 2 }}>
            {/* Toggle Button — hidden in full-page mode */}
            {!fullPage && (
                <Button
                    variant={open ? 'contained' : 'outlined'}
                    startIcon={<GeminiIcon />}
                    endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setOpen(v => !v)}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: open
                            ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                            : undefined,
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        '&:hover': {
                            background: open
                                ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                                : alpha(theme.palette.primary.main, 0.08),
                        }
                    }}
                >
                    Ask Gemini AI
                </Button>
            )}

            <Collapse in={open} timeout={fullPage ? 0 : 'auto'}>
                <Paper
                    elevation={fullPage ? 0 : 3}
                    sx={{
                        mt: fullPage ? 0 : 1.5,
                        borderRadius: fullPage ? 0 : 3,
                        overflow: 'hidden',
                        border: fullPage ? 'none' : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        background: fullPage ? 'transparent' : alpha(theme.palette.background.paper, 0.85),
                        backdropFilter: fullPage ? 'none' : 'blur(12px)',
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            px: 2,
                            py: 1.2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GeminiIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Wishes AI Assistant
                            </Typography>
                            <Chip
                                label={hasKey ? 'Ready' : 'No API Key'}
                                size="small"
                                color={hasKey ? 'success' : 'warning'}
                                sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {messages.length > 0 && (
                                <Tooltip title="Clear conversation">
                                    <IconButton size="small" onClick={clearChat}>
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {!fullPage && (
                                <IconButton size="small" onClick={() => setOpen(false)}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    {/* No API key warning */}
                    {!hasKey && (
                        <Box sx={{ px: 2, py: 1.5, background: alpha(theme.palette.warning.main, 0.08) }}>
                            <Typography variant="caption" color="warning.main">
                                ⚠ Add your Gemini API key in{' '}
                                <strong>Settings → Profile & AI</strong> to use the AI assistant.
                                Get a free key at{' '}
                                <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" sx={{ color: 'warning.main' }}>
                                    aistudio.google.com
                                </Link>.
                            </Typography>
                        </Box>
                    )}

                    {/* Messages */}
                    <Box
                        sx={{
                            height: fullPage ? 'calc(100vh - 320px)' : 360,
                            minHeight: fullPage ? 400 : undefined,
                            overflowY: 'auto',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {messages.length === 0 && (
                            <Box sx={{ textAlign: 'center', my: 'auto', opacity: 0.6 }}>
                                <GeminiIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Ask me anything about your wishes!
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center', mt: 1.5 }}>
                                    {[
                                        'Which wishes should I prioritize?',
                                        'How long will my current setup take?',
                                        'Am I allocating resources optimally?',
                                        'Explain the wish formula',
                                        'What are precision loss issues?',
                                    ].map(suggestion => (
                                        <Chip
                                            key={suggestion}
                                            label={suggestion}
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            onClick={() => {
                                                setInput(suggestion);
                                                if (inputRef.current) inputRef.current.focus();
                                            }}
                                            sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {messages.map((msg, idx) => (
                            <MessageBubble key={idx} msg={msg} theme={theme} />
                        ))}

                        {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <GeminiIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                                <Paper
                                    elevation={0}
                                    sx={{
                                        px: 2, py: 1,
                                        borderRadius: '4px 16px 16px 16px',
                                        background: alpha(theme.palette.background.paper, 0.6),
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <CircularProgress size={14} thickness={5} />
                                    <Typography variant="caption" color="text.secondary">Thinking…</Typography>
                                </Paper>
                            </Box>
                        )}

                        {error && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="error">
                                    ⚠ {error}
                                </Typography>
                            </Box>
                        )}

                        <div ref={messagesEndRef} />
                    </Box>

                    <Divider sx={{ opacity: 0.15 }} />

                    {/* Input */}
                    <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            multiline
                            maxRows={4}
                            size="small"
                            variant="outlined"
                            placeholder={hasKey ? 'Ask about your wishes… (Enter to send, Shift+Enter for newline)' : 'Add your Gemini API key in Settings to chat…'}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!hasKey || loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2.5,
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={sendMessage}
                            disabled={!hasKey || !input.trim() || loading}
                            sx={{
                                background: input.trim() && hasKey
                                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                    : undefined,
                                color: input.trim() && hasKey ? 'white' : undefined,
                                borderRadius: 2,
                                '&:hover': {
                                    background: input.trim() && hasKey
                                        ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                                        : undefined,
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={20} thickness={5} color="inherit" /> : <SendIcon />}
                        </IconButton>
                    </Box>

                    <Box sx={{ px: 2, pb: 1 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                            Context includes: all {Wishes.length} wishes, your current resources, optimization results, and live sync data.
                        </Typography>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}
