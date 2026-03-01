// 文件服务 - 统一本地 Node.js 和 Cloudflare Worker 环境的文件读取

import { ormService } from './ormService'

// ============================================================
// Worker 环境的文件注册系统
// ============================================================

// 已注册的文件内容（Worker 环境下由 resourceLoader 注册）
const registeredFiles: Map<string, string> = new Map()

// 已注册的目录文件列表
const registeredDirs: Map<string, string[]> = new Map()

/**
 * 注册文件内容（供 Worker 环境使用）
 */
export function registerFile(filePath: string, content: string): void {
  registeredFiles.set(filePath, content)

  // 自动更新目录文件列表
  const lastSlash = filePath.lastIndexOf('/')
  if (lastSlash >= 0) {
    const dir = filePath.substring(0, lastSlash)
    const fileName = filePath.substring(lastSlash + 1)
    const files = registeredDirs.get(dir) || []
    if (!files.includes(fileName)) {
      files.push(fileName)
      registeredDirs.set(dir, files)
    }
  }
}

// ============================================================
// Worker 环境实现（使用已注册的文件）
// ============================================================

async function readFileInWorker(filePath: string): Promise<string> {
  const content = registeredFiles.get(filePath)
  if (content !== undefined) {
    return content
  }
  throw new Error(`File not available in Worker: ${filePath}. Use registerFile() to register it.`)
}

async function listFilesInWorker(dirPath: string, pattern: string): Promise<string[]> {
  const files = registeredDirs.get(dirPath) || []
  return filterByPattern(files, pattern)
}

// ============================================================
// Node.js 环境实现（通过 fs 模块读取文件系统）
// ============================================================

function getProjectRoot(): string {
  const { resolve, dirname } = require('path')
  const { existsSync } = require('fs')

  const cwd = process.cwd()
  if (existsSync(resolve(cwd, 'package.json'))) {
    return cwd
  }

  try {
    const currentDir = dirname(__filename)
    const root = resolve(currentDir, '../..')
    if (existsSync(resolve(root, 'package.json'))) {
      return root
    }
  } catch (_) { }

  return cwd
}

async function readFileInNode(filePath: string): Promise<string> {
  const { readFileSync } = require('fs')
  const { resolve } = require('path')
  const fullPath = resolve(getProjectRoot(), filePath)
  return readFileSync(fullPath, 'utf-8')
}

async function listFilesInNode(dirPath: string, pattern: string): Promise<string[]> {
  const { readdirSync, existsSync } = require('fs')
  const { resolve } = require('path')
  const fullPath = resolve(getProjectRoot(), dirPath)

  if (!existsSync(fullPath)) {
    return []
  }

  const files: string[] = readdirSync(fullPath)
  return filterByPattern(files, pattern)
}

// ============================================================
// 通用工具
// ============================================================

function filterByPattern(files: string[], pattern: string): string[] {
  if (pattern === '*') return files
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1)
    return files.filter(f => f.endsWith(ext))
  }
  return files
}

// ============================================================
// 统一接口
// ============================================================

/**
 * 读取文件内容
 * @param filePath 文件路径（相对于项目根目录，如 'src/resource/migrate_0001.sql'）
 */
export async function readFile(filePath: string): Promise<string> {
  if (ormService.isLocal) {
    return readFileInNode(filePath)
  }
  return readFileInWorker(filePath)
}

/**
 * 列出指定目录下的所有文件
 * @param dirPath 目录路径（相对于项目根目录，如 'src/resource'）
 * @param pattern 文件匹配模式（如 '*.sql'，默认为 '*'）
 */
export async function listFiles(dirPath: string, pattern: string = '*'): Promise<string[]> {
  if (ormService.isLocal) {
    return listFilesInNode(dirPath, pattern)
  }
  return listFilesInWorker(dirPath, pattern)
}

export default {
  readFile,
  listFiles,
  registerFile,
}
