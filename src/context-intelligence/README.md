# Context Intelligence Engine

Hệ thống tối ưu hóa context để giảm chi phí API token.

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                   Context Intelligence                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Fingerprinter  │   Compressor    │    Smart Orchestrator   │
│                 │                 │                         │
│ • Content hash  │ • Semantic      │ • Context selector      │
│ • Version track │   compression   │ • Priority ranking      │
│ • Dedup detect  │ • Lossy/lossless│ • Token budgeting       │
│ • Cache keys    │ • Multi-stage   │ • Cache routing         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Tính năng

### 1. Context Fingerprinting
- Mỗi message có unique hash (SHA-256)
- Track version changes của system prompt
- Detect duplicate content across sessions
- Enable cache reuse với Anthropic prompt caching

### 2. Smart Compression
- **Semantic compression**: Giữ ý nghĩa, giảm token
- **Importance scoring**: Message quan trọng giữ nguyên
- **Progressive summarization**: Nén dần theo thời gian
- **Lossy markers**: Đánh dấu đã nén để restore nếu cần

### 3. Intelligent Orchestration
- **Token budgeting**: Phân bổ ngân sách token cho mỗi phần
- **Context selection**: Chọn context phù hợp với task
- **Cache-aware routing**: Tận dụng Anthropic prompt cache
- **Adaptive pruning**: Prune thông minh dựa trên importance

## Tiết kiệm dự kiến

| Tính năng | Token tiết kiệm |
|-----------|-----------------|
| Fingerprint + cache | 30-50% |
| Smart compression | 20-40% |
| Intelligent orchestration | 10-20% |
| **Tổng cộng** | **50-80%** |
