# 役次元 Tencent IM 控制协议（草稿，正在实现）

## 规范前言

由于设备类型丰富，协议采用 **事件 ID 驱动的通用控制结构**。
每个事件以唯一的 `id` 标识，并根据设备类型关联特定的**默认参数模板**。用户可对模板参数自定义并设置安全阈值。

**操作步骤**

- 开发者在役次元app内创建游戏并填写配置
- 开发者编写联动教程并分享二维码
- 玩家扫描役次元app分享的游戏二维码
- 用户手动修改配置并保存
- 用户在役次元app启动游戏并向第三方游戏提供uid和token
- 游戏连接IM
- 发送后续指令

**如何发送指令**

每一段指令都需要**JSON 对象序列化成字符串**后填入腾讯 IM 消息包中`payload.text`

建议先查看役次元IM基础协议 [IM_basic.md](IM_basic.md) 

遇到问题请先查看 [troubleshooting.md](troubleshooting.md) 

------

## 发送执行指令

```
{
  "code": "game_cmd",
  "id": "hurt"
}
```

## 更新游戏事件定义（正在开发）

将游戏metadata装入IM的`payload.text`中发送

## 四、自定义指令（草稿，预留接口，暂缓开发）

1️⃣自定义波形与强度

```
{
  "code": "game_cmd",
  "id": "_estim_custom_waveform",
  "payload": {
  
  }
}
```



