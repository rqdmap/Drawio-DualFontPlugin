# Drawio-DualFontPlugin

> [!WARNING]
> **Deprecated.** Draw.io 已可通过原生字体 fallback 直接处理中英文字体混排，不再推荐继续使用插件方案。
>
> 推荐的原生字体配置：`'Times New Roman','Simsun'`
>
> 说明文章与迁移背景：<https://rqdmap.top/posts/dual-font-in-drawio/>

这个仓库保留为**历史参考**。

最初的插件方案会遍历图元文本，将中文与非中文拆分，并通过 HTML / `span` 标签分别设置字体，以实现“中文使用宋体、英文使用 Times New Roman”的自动化混排。

后续确认 Draw.io 原生支持字体族配置后，直接使用字体 fallback 即可达到同类效果，复杂度更低，也避免了桌面端插件加载、持久化与调试方面的问题。

## 推荐方案

在 Draw.io 的字体设置中直接填写：

```text
'Times New Roman','Simsun'
```

当首选字体无法覆盖中文字符时，渲染会自动回退到 `Simsun`。

## 仓库内容

- `dual-font-plugin.js`：旧的 Draw.io 插件实现，仅供参考
- `LICENSE`：许可证文件

## Status

This repository is kept for historical reference only. The native Draw.io font fallback configuration is now the recommended solution.
