# Network Guide

This document describes the basic message formats used by `NetworkClient` for synchronising
remote players and world state.

## PlayerStateUpdate

```
{
  "type": "PlayerStateUpdate",
  "data": {
    "id": "player-id",
    "position": { "x": 0, "y": 1, "z": 2 },
    "rotation": { "x": 0, "y": 0, "z": 1 }
  }
}
```

Updates or spawns a remote `Character` with the provided id. When first encountered,
the client loads the default character model and adds it to the world.

## WorldSync

```
{
  "type": "WorldSync",
  "data": {
    "sunElevation": 50,
    "sunRotation": 145,
    "despawnPlayers": ["old-id"]
  }
}
```

Adjusts global parameters such as sun position and despawns players listed in
`despawnPlayers`.
