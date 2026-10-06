# 随手账

一个轻量的个人记账网页：记录每天的收入与支出，查看每月总额、分类占比和每日趋势。中文界面，适配手机和电脑，无需注册账本账号。

[在线使用](https://092633ss-boop.github.io/suishou-account/) · [下载源码](https://github.com/092633ss-boop/suishou-account/archive/refs/heads/main.zip) · [反馈问题](https://github.com/092633ss-boop/suishou-account/issues)

![随手账界面](docs/preview.jpg)

## 能做什么

- 记录人民币收入或支出：金额、分类、日期、备注，支持补记、编辑和删除。
- 按月查看收入、支出和结余，按天查看收支明细。
- 切换收入或支出分类占比，查看每日趋势及某一天的具体金额。
- 新增或重命名分类，保留历史记录关联。
- 导出 JSON 备份；恢复前校验和确认，取消恢复不改变账本。
- 首次加载完成后离线使用；账本保存在当前浏览器。

## 直接使用

打开上方“在线使用”，点击“记一笔”即可。**每个人的账本都保存在自己的浏览器中**，不会上传到 GitHub，也不会共享给其他访问者。建议定期使用“账本备份”。如果浏览器未开始下载，可在备份窗口查看 JSON 内容，复制后保存为 `.json` 文件。

浏览器、设备或部署地址不同，账本独立；换设备或换网址时，通过导出／恢复备份手动迁移。清理浏览器的网站数据会移除账本。首次加载并显示“离线资源已就绪”后，可离线重新打开和记账。

## 在自己的电脑运行

下载源码 ZIP 并解压，或克隆仓库：

```sh
git clone https://github.com/092633ss-boop/suishou-account.git
cd suishou-account
python3 -m http.server 48762 --bind 127.0.0.1 --directory dist
```

打开 <http://127.0.0.1:48762/>。Windows 上可使用 `py -m http.server 48762 --bind 127.0.0.1 --directory dist`。无需安装前端依赖。保持地址和端口不变，以继续使用同一账本；不要直接双击 HTML 文件，以免模块加载和离线功能受限。

## 部署到自己的 GitHub Pages

1. Fork 本仓库；若 GitHub Actions 被暂停，先在 **Actions** 中启用工作流。
2. 在 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
3. 在 **Actions → Test and publish → Run workflow** 中选择 `main` 并运行。
4. 工作流成功后，在 **Settings → Pages** 查看你的在线地址，也可以在部署任务中点击 **github-pages** 环境地址。

以后提交到 `main` 时，工作流会先检查代码并运行测试，再发布 `dist/`。Pull Request 只运行检查，不发布。所有资源使用相对路径，支持 GitHub Pages 仓库子目录。

## 开发与验证

使用 Node.js 22 或更新版本（自动化工作流使用 Node.js 24）：

```sh
node --check dist/app.js
node --check dist/sw.js
node --test tests/*.test.mjs
```

`dist/` 是可直接部署的应用，`tests/` 包含金额精度、日期、分类、备份、统计及存储失败校验。金额使用整数分，日期使用本地 `YYYY-MM-DD` 字符串。备份版本为 `1`，包含 `categories` 和 `transactions`。

账本与离线缓存按部署路径隔离。更新离线资源时，请递增 `dist/sw.js` 中的缓存版本，避免多个部署之间相互影响。支持 WebMCP 的浏览器中会注册新增记录与月度统计工具，普通浏览器无需此能力。

## 许可

[MIT License](LICENSE)。你可以使用、修改和分发本软件，请保留版权与许可声明。
