import puppeteer from 'puppeteer'
import prompt from 'prompt'
import assert from 'assert'
import 'dotenv/config'
import fsPromises from 'fs/promises'
import path from 'path'

const DBUDGET_USERNAME = 'DBUDGET_USERNAME'
const DBUDGET_PASSWORD = 'DBUDGET_PASSWORD'
const DEVICE_NAME = 'DEVICE_NAME'

const getFromEnv = async (key: string, hidden = false) =>
  process.env[key] ??
  (
    await prompt.get({
      properties: {
        [key]: {
          required: true,
          // @ts-ignore
          hidden,
        },
      },
    })
  )[key]
// @ts-ignore
const isPkg = typeof process.pkg !== 'undefined'
const getExecutablePath = () => {
  if (process.platform == 'win32') {
    return isPkg
      ? puppeteer
          .executablePath()
          .replace(
            /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
            path.join(path.dirname(process.execPath), 'chromium'),
          )
      : puppeteer.executablePath()
  }

  return isPkg
    ? puppeteer
        .executablePath()
        .replace(
          /^.*?\/node_modules\/puppeteer\/\.local-chromium/,
          path.join(path.dirname(process.execPath), 'chromium'),
        )
    : puppeteer.executablePath()
}

;(async () => {
  const username = await getFromEnv(DBUDGET_USERNAME)
  const deviceName = await getFromEnv(DEVICE_NAME)
  const password = await getFromEnv(DBUDGET_PASSWORD, true)
  assert(
    typeof username === 'string' &&
      typeof password === 'string' &&
      typeof deviceName === 'string',
  )
  await fsPromises.writeFile(
    '.env',
    `${DBUDGET_USERNAME}=${username}\n${DEVICE_NAME}=${deviceName}\n${DBUDGET_PASSWORD}=${password}`,
  )

  const browser = await puppeteer.launch({
    userDataDir: './data',
    executablePath: getExecutablePath(),
  })
  const page = await browser.newPage()
  await page.goto('https://dbudget.vercel.app/')
  await page.type('#username', username)
  await page.type('#password', password)
  await page.focus('#deviceName')
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(deviceName)
  await page.keyboard.press('Enter')
})()
