# IM协议错误排查

## 请求登录的过程中获取签名时需要带"game_"前缀



## 输出msg

```
console.log(msg)
await this.chat.sendMessage(msg);
```

e {
  ID: '144115247052381908-1762314428-66625257',
  conversationID: 'C2C50141',
  conversationType: 'C2C',
  conversationSubType: undefined,
  time: 1762314430,
  sequence: 1147090001,
  clientSequence: 1147090001,
  random: 66625257,
  priority: 'Normal',
  nick: '',
  avatar: '',
  isPeerRead: false,
  nameCard: '',
  hasRiskContent: false,
  _elements: [ e { type: 'TIMTextElem', content: [Object] } ],
  isPlaceMessage: 0,
  isRevoked: false,
  ==from: 'game_50141',==
  ==to: '50141',==
  flow: 'out',
  isSystemMessage: false,
  protocol: 'JSON',
  isResend: false,
  isRead: true,
  status: 'unSend',
  _onlineOnlyFlag: false,
  _groupAtInfoList: [],
  _relayFlag: false,
  atUserList: [],
  cloudCustomData: '',
  isDeleted: false,
  isModified: false,
  _isExcludedFromUnreadCount: false,
  _isExcludedFromLastMessage: false,
  clientTime: 1762314428,
  senderTinyID: '144115247052381908',
  readReceiptInfo: {
    readCount: undefined,
    unreadCount: undefined,
    isPeerRead: undefined,
    timestamp: 0
  },
  needReadReceipt: false,
  version: 0,
  isBroadcastMessage: false,
  _receiverList: undefined,
  isSupportExtension: false,
  _cmConfigID: undefined,
  revoker: '',
  revokerInfo: { userID: '', nick: '', avatar: '' },
  revokeReason: '',
  pinnerInfo: null,
  level: 0,
  payload: {
    text: '{"code":"game_info","data":1,"token":"rQ9815VhHJe2xxxxx86169cf1c23388"}'==注意这里是json字符串==
  },
  type: 'TIMTextElem'
}

