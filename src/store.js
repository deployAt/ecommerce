import { createContext } from 'react'
import { runInAction, makeAutoObservable } from 'mobx'
import { ethers } from 'ethers'
import { utils } from 'web3'
import axios from 'axios'

import { PRODUCTS } from './data/products'

export class Store {
  library = null
  account = 0
  balance = 0
  products = PRODUCTS
  activeProduct = null
  ethPrice = 0
  gasPrices = null

  constructor() {
    makeAutoObservable(this)
  }

  init(library, account) {
    this.library = library
    this.account = account
    this.getBalance()
    this.getETHPrice()
    this.getGasPrices()
  }

  async getBalance() {
    try {
      const bal = await this.library.eth.getBalance(this.account, 'latest')
      runInAction(() => {
        this.balance = parseFloat(utils.fromWei(bal, 'ether')).toPrecision(6)
      })
    } catch (e) {
      console.log(e)
    }
  }

  async getETHPrice() {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const {
        ethereum: { usd },
      } = res.data
      runInAction(() => {
        this.ethPrice = usd
      })
    } catch (e) {
      console.log(e)
    }
  }

  async getGasPrices() {
    try {
      const res = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
      const prices = {
        low: res.data.safeLow / 10,
        medium: res.data.average / 10,
        high: res.data.fast / 10,
      }
      runInAction(() => {
        this.gasPrices = prices
      })
    } catch (e) {
      console.log(e)
    }
  }

}

export const StoreContext = createContext()
