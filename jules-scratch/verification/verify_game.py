import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Wait for a moment to ensure the game has rendered
        await page.wait_for_timeout(2000)

        # Take a screenshot
        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

asyncio.run(main())