import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { IPreowner } from 'src/module/preowner/interfaces/preowner.interfaces';

@Injectable()
export class XLSXUtil {

  /**
  * ----{处理excel表格，获得worksheet}----
  * @param {String} path 表格路径
  * @returns {Promise} promise
  * @author:oy
  */
  async getWorksheet(path) {
    const workbook = XLSX.readFile(path);
    const sheetNames = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheetNames[0]];
    return worksheet;
  }

  /**
  * ----{获取excel表格的表头}----
  * @param {Object} worksheet worksheet对象
  * @returns {Promise} promise
  * @author:oy
  */
  async genOwner(worksheet, zone: string) {
    const owners: any = []
    const headers: any = {};
    const keys = Object.keys(worksheet).filter(k => k[1] === "1" && k.length === 2);
    console.log(keys)
    for (let key of keys) {
      const col = key.substring(0, 1);
      const value = worksheet[key].v.replace(/ /g, "");
      switch (value) {
        case '住户名称':
          headers.username = col
          break;
        case '身份号码':
          headers.cardNumber = col
          break;
        case '入住房间名称':
          headers.house = col
          break;
        default:
          break;
      }
    }
    let length = worksheet["!ref"].split(":")[1].substring(1);
    if (!"0123456789".includes(length[0])) length = length.substring(1);
    for (let i = 2; i <= length; i++) {
      console.log(headers, 'headers')
      console.log(`${headers.house}${i}`, worksheet[`${headers.house}${i}`])
      const house = worksheet[`${headers.house}${i}`].v.replace(/ /g, "")
      const houseNumbers = house.split('-').map(v => Number(v))
      const building = `${houseNumbers[0]}幢`
      const houseNumber = `${houseNumbers[1]}室`
      owners.push({
        username: worksheet[`${headers.username}${i}`].v.replace(/ /g, ""),
        cardNumber: worksheet[`${headers.cardNumber}${i}`].v.replace(/ /g, ""),
        building,
        houseNumber,
        zone,
      })
    }
    return owners
  }

}