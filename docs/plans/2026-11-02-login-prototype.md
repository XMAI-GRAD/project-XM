# Login prototype

Goal: a styled mockup of the login screen in the cinematic direction (prototype B), so the designer can see which parts of the login screen need designing. No real auth.

Route: `/vi/proto/b/login` (and `/en/...`). Prototype B's nav "Account" link points here. The floating switcher keeps working.

## Layout

Desktop, two columns at full viewport height:

- Left: the same rounded image frame as B's hero (16px radius, flat dark tone), captioned `<Ảnh di sản>`.
- Right: the login panel, vertically centred.

The nav pill sits at the top. Mobile (≤ 800px) stacks a shorter frame (4:3) above the panel.

## Components (each a labeled placeholder)

| Component     | Placeholder (vi)                                           | Note                                                                                                   |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Headline      | `<Login · tiêu đề>`                                        | Same type scale as B's hero phrase                                                                     |
| Lead          | `<Login · 1 câu: đăng nhập để lưu yêu thích và bình luận>` | Content is readable without login (SPEC)                                                               |
| Google button | `<Nút · Tiếp tục với Google>`                              | Light pill like B's CTA, with a G mark slot                                                            |
| Error         | `<Login · thông báo lỗi …>`                                | Always shown in the prototype so the designer sees the state; real page shows it only on `?error=auth` |
| Note          | `<Login · ghi chú quyền riêng tư / điều khoản>`            | Small, dim                                                                                             |
| Back link     | `<Link · Quay lại trang chủ>`                              | To `/[lang]/proto/b`                                                                                   |

English mirrors every label.

## Rules

- Copy goes in `proto/_mock.ts` (`mockCopy[lang].login`), like the rest of the prototypes.
- Reuse B's `page.module.css` for the root, nav pill and tokens. New styles go in `login/page.module.css`.
- The button is a plain `<button type="button">`: no Server Action, no session read.
- Focus is visible on every control; nothing animates, so reduced motion needs no extra rule.
- At 390px, no horizontal scroll.

## After

Once the designer delivers, restyle the real `/[lang]/(auth)/login` page with dictionary strings, then delete this route with the rest of `proto/`.
