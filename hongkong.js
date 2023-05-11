import puppeteer from "puppeteer";
import { writeFileSync } from "fs";
import { parse } from 'json2csv';

const saveAsCSV = (csvData) => {
    const csv = parse(csvData)
    writeFileSync('result.csv', csv);
}

const getQuotes = async () => {
    
    const width=1024, height=1600;

    const browser = await puppeteer.launch({
        executablePath: 'C:/chrome-win/chrome.exe',
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0)
    await page.goto("https://www.openrice.com/en/hongkong/restaurants");

    let items = [];
    let results = [];
    let lastNumber = 17;

    await page.waitForTimeout(50000)
    for (let i = 0; i < lastNumber; i++) {
        items = items.concat(await extractedEvaluateCall(page));
        if (i !== lastNumber - 1) {
            const aTagLength = await page.$$eval("div.js-pagination a", els => els.length)
            await page.click('div.js-pagination a:nth-child('+aTagLength+')')
            await page.waitForTimeout(5000)
        }
    }

    for (const item of items) {
        await page.goto(item.openrice_link);
        await page.waitForTimeout(5000)
        const phone = await getPhone(page);

        const insertData = {
            name: item.name,
            address: item.address,
            openrice_link: item.openrice_link,
            phone: phone
        }
        results.push(insertData)
    }

    console.log(results)

    await browser.close()

    saveAsCSV(results);
};

async function extractedEvaluateCall(page) {
    await page.waitForTimeout(2000);
    return await page.evaluate(() => {
        const items = document.querySelectorAll("div#or-route-poi-list-main ul li.sr1-listing-content-cell");

        return Array.from(items).map((item) => {
            const name = item.querySelector("h2.title-name a").innerText;
            const address = item.querySelector("div.details-wrapper div.central-content-container div.icon-info-wrapper div.address span").innerText;
            const openrice_link = item.querySelector("h2.title-name a").href;
            return { name, address, openrice_link }
        });
    });
}

async function getPhone(page) {
    await page.waitForSelector('div.left-col')

    let phone = ''
    try {
        phone = await page.$eval("div.or-section div.left-middle-col-section section.telephone-section div.content", el => el.innerText)
    } catch (e) { }

    return { phone }
}

getQuotes();