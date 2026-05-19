"""Static configuration and defaults for pdk."""

# Default WebSocket endpoint of a local Portaldot dev node.
DEFAULT_NODE_URL = "ws://127.0.0.1:9944"

# Substrate does not index tx hash -> block. When `pdk debug` is given a bare
# tx hash, it scans this many recent blocks looking for the matching extrinsic.
RECENT_BLOCKS_SCAN = 50

# Name of the Portaldot node binary expected on PATH (Linux/WSL only).
NODE_BINARY = "portaldot_dev"
