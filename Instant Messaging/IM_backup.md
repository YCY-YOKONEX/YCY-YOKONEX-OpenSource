# 役次元 Tencent IM 控制协议（备选草稿，未实现）

## 规范前言

- 下方每一段代码块就是腾讯 IM 包中 **`payload.text` 的完整内容**（JSON 对象序列化成字符串前的结构）

------

## 1) 通道控制（`control_channel`）

**用途**：
 将指定通道的输出参数直接设为

> ```
> app端设置的最大强度 × ( strength / 100 )
> ```

并维持指定的毫秒数（`duration_ms`）后自动结束，或由下一条指令覆盖。

**约束**：

- `channel ∈ {"A","B","AB"}`
- `strength ∈ [0,100]` 且为整数
- `duration_ms` 为正整数，单位毫秒（ms）；为 0 时表示持续至下一条指令（持续执行）。建议范围 `1000 – 60000`

```json
{
  "code": "game_opts",
  "actions": [
    {
      "type": "estim",
      "action": "control_channel",
      "data": {
        "channel": "A",
        "strength": 60,
        "duration_ms": 5000
      }
    },
    {
      "type": "estim",
      "action": "control_channel",
      "data": {
        "channel": "B",
        "strength": 30,
        "duration_ms": 4000
      }
    }
  ]
}
```

**说明：**

- `strength` ：当前相对强度百分比（例如 60 表示 60 %）。
- `duration_ms` ：执行持续时间（单位 ms）。
- 通道 `"AB"` 表示同时作用于 A 与 B 两个通道。
- 后续版本可在 `data` 中新增 `waveform`、`frequency_hz` 等字段，向后兼容。

------

## 2) 清空通道（`clear_channel`）

**用途**：
 清空指定通道的排队任务或缓冲，不影响当前已生效的固定强度值。

**约束**：`channel ∈ {"A","B","AB"}`

```json
{
  "code": "game_opts",
  "type": "estim",
  "action": "clear_channel",
  "data": {
    "channel": "B"
  }
}
```

------

## 3) 设备配对结果（`device_paired`）

**用途**：
 首次握手或扫码配对完成后，**由 App 端发送给 服务端**，用于同步配对状态。

**约束**：`status ∈ {"success","failed"}`

```json
{
  "code": "game_opts",
  "type": "device_paired",
  "action": "device_paired",
  "data": {
    "status": "success",
    "uid": "<user-uid>"
  }
}
```

------

## 5) 错误回执（`error`） 

**用途**：
 app向上游或调试端明确失败原因与可恢复性，便于闭环排查。

**约束**：

- `severity ∈ {"error","warning"}`
- `code` 为整型错误码
- `details` 可选 dict类型

```json
{
  "code": "game_opts",
  "type": "estim",
  "action": "error",
  "data": {
    "code": 403,
    "message": "invalid channel value",
    "severity": "error",
  }
}
```

