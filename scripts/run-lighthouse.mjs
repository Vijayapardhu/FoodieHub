import { execSync } from "node:child_process"
import { mkdirSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const url = process.env.LH_URL || "http://localhost:3000"
const outputDir = resolve("reports")

if (!existsSync(outputDir)) {
  mkdirSync(outputDir)
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
const outputPath = resolve(outputDir, `lighthouse-${timestamp}.html`)

console.log(`Running Lighthouse for ${url}`)
console.log(`Report will be saved to ${outputPath}`)

execSync(
  `npx lighthouse ${url} --output html --output-path ${outputPath} --preset perf`,
  {
    stdio: "inherit",
  }
)

console.log("Lighthouse report generated successfully.")

