# Vibecode Lessons Learned

Tài liệu ghi lại các bài học từ mỗi build để cải tiến methodology liên tục.

---

## Template

Khi gặp issue, document theo format sau:

```markdown
## [YYYY-MM-DD] Issue Title

**Project:** [Tên project]
**Phase:** Architect | Builder | Verification
**Severity:** Critical | High | Medium | Low

### Vấn đề
[Mô tả vấn đề gặp phải]

### Root Cause
[Nguyên nhân gốc rễ]

### Solution
[Cách giải quyết]

### Prevention
[Cách ngăn ngừa trong tương lai]

### Methodology Update
- [ ] Cập nhật METHODOLOGY.md
- [ ] Cập nhật Schema
- [ ] Cập nhật Tools
- [ ] Cập nhật Templates
```

---

## Logged Issues

### [2024-01-XX] Apple Landing Page - Broken Images

**Project:** Apple Vietnam Showcase
**Phase:** Builder + Verification
**Severity:** Critical

#### Vấn đề
Tất cả hình ảnh sản phẩm Apple không load được. Builder báo cáo "DONE" nhưng sản phẩm thực tế không hoạt động.

#### Root Cause
1. **URLs không được verify trước khi đưa vào Blueprint**
   - Apple CDN có hotlink protection
   - URLs cần authentication hoặc proper referrer

2. **Gộp vai trò Architect + Builder trong Claude Code**
   - Claude Code được tối ưu cho execution speed
   - Bỏ qua bước verify resources
   - Rush to completion

3. **Verification checklist không được thực thi**
   - Builder tự báo DONE mà không kiểm tra thực tế
   - Không có automated check

#### Solution
1. Tách biệt Architect (Claude Chat) và Builder (Claude Code)
2. Sử dụng Unsplash URLs (verified, hotlink-friendly)
3. Implement fallback URLs cho mỗi image
4. Thêm `onError` handler trong code

#### Prevention
1. **Bắt buộc** Architect verify tất cả URLs trước khi đưa vào Blueprint
2. Tạo tool `verify-blueprint.ts` để automated check
3. Tạo tool `qa-check.ts` để verify sau build
4. Schema yêu cầu `verified: true` cho mỗi image asset

#### Methodology Update
- [x] Cập nhật METHODOLOGY.md - thêm resource verification rules
- [x] Cập nhật Schema - require `verified: true` for images
- [x] Tạo verify-blueprint.ts tool
- [x] Tạo qa-check.ts tool
- [x] Tạo templates với verified URLs sẵn

---

### [Template for future issues]

### [YYYY-MM-DD] Issue Title

**Project:**
**Phase:**
**Severity:**

#### Vấn đề


#### Root Cause


#### Solution


#### Prevention


#### Methodology Update
- [ ] Cập nhật METHODOLOGY.md
- [ ] Cập nhật Schema
- [ ] Cập nhật Tools
- [ ] Cập nhật Templates

---

## Metrics

Track improvement over time:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Build success rate | 60% | TBD | 95% |
| Image load failures | High | TBD | 0% |
| False "DONE" reports | Common | TBD | 0% |
| Time to first working build | Variable | TBD | Consistent |

---

## Review Schedule

- **Weekly:** Review new issues, update tools if needed
- **Monthly:** Analyze patterns, update methodology
- **Quarterly:** Major methodology revision if needed
