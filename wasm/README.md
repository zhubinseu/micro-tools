# WASM 模块目录

本目录用于存放 WebAssembly 模块源码与构建产物。

## 目录结构

```
wasm/
├── README.md          # 本文件
├── src/               # WASM 模块源码（Rust / AssemblyScript / Zig）
│   └── calculator.rs  # 示例：Rust 源码
├── pkg/               # 构建产物（.wasm 文件，被 .gitignore 忽略）
└── build.sh           # 构建脚本
```

## 工作流程

1. 在 `src/` 中编写 WASM 模块源码
2. 编译为 `.wasm` 文件，产物输出到 `pkg/`
3. 将 `.wasm` 文件复制到 `public/wasm/` 目录
4. 在前端代码中通过 `lib/wasm.ts` 的 `loadWasm()` 加载

## 示例：Rust → WASM

```bash
# 安装 wasm-pack
cargo install wasm-pack

# 在 src/ 目录创建 Rust 项目后编译
cd wasm/src/calculator
wasm-pack build --target web --release

# 复制产物到 public
cp pkg/calculator_bg.wasm ../../public/wasm/calculator.wasm
```

## 示例：在组件中使用

```typescript
import { loadWasm, callWasm } from '@/lib/wasm';

const instance = await loadWasm('/wasm/calculator.wasm');
const result = callWasm<number>(instance, 'add', 2, 3); // 5
```

## 何时使用 WASM

- 图像处理（像素级操作）
- 密码学计算（非 SubtleCrypto 覆盖的场景）
- 复杂数学运算（矩阵、FFT）
- 编解码（自定义格式）

对于浏览器原生支持的能力（如 SHA 哈希），优先使用 `crypto.subtle` + Web Worker。
