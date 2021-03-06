import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { observer } from 'mobx-react-lite'
import { utils } from 'ethers'
import moment from 'moment'

export const Wallet = observer(() => {
  const { library } = useWeb3React()
  const [transactions, setTransactions] = useState(null)
  const [blocksLoader, setBlocksLoader] = useState(0)

  useEffect(() => {
    main()
  }, [])

  const main = async () => {
    const MNEMONIC = process.env.REACT_APP_MNEMONIC

    const masterNode = utils.HDNode.fromMnemonic(MNEMONIC)
    // console.log('privateKey:', masterNode.privateKey)
    // console.log('publicKey:', masterNode.publicKey)

    const accounts = []

    for (let i = 0; i < 20; i++) {
      const path = "m/44'/60'/0'/0/" + i
      const addrNode = masterNode.derivePath(path)

      // console.log('Generated address:', addrNode.address)
      // console.log('Generated path:', addrNode.path)

      const bal = await library.eth.getBalance(addrNode.address, 'latest')

      const balanceFormat = parseFloat(library.utils.fromWei(bal, 'ether')).toPrecision(6)
      // console.log('balance: ', balanceFormat)

      if (balanceFormat > 0) {
        accounts.push(addrNode.address)
      }
    }

    await getTransactionsByAccount(accounts)
  }

  const getTransactionsByAccount = async (accounts, startBlockNumber, endBlockNumber) => {
    if (endBlockNumber == null) {
      endBlockNumber = await library.eth.getBlockNumber()
    }
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 100
    }

    let result = []

    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
      // console.log(`Searching block ${i} / ${endBlockNumber}`)
      setBlocksLoader(`${i} / ${endBlockNumber}`)

      let block = await library.eth.getBlock(i, true)
      let blockNumber = block.number

      if (block != null && block.transactions != null) {
        for (let tx of block.transactions) {
          if (accounts.includes(tx.to)) {
            // console.log('Transaction found on block: ' + blockNumber)
            const confirmations = endBlockNumber - blockNumber
            const txObj = {
              hash: tx.hash,
              to: tx.to,
              from: tx.from,
              value: library.utils.fromWei(tx.value, 'ether'),
              timestamp: moment(block.timestamp, 'X').format('DD MM YYYY HH:mm:ss'),
              blockNumber,
              confirmations,
            }
            result.push(txObj)
            setTransactions(result)
          }
        }
      }
    }
  }

  return (
    <div className="column is-9-desktop mt-5 p-5 is-shady">
      <p className="tag is-warning is-light is-large mb-4 pl-0">Searching block: {blocksLoader} (-100 blocks)</p>
      {transactions &&
        transactions.map((tx, i) => (
          <div key={i}>
            <div className="columns is-multiline is-vcentered">
              <div className="column">
                <div className="field is-grouped is-grouped-multiline">
                  <div className="control">
                    <div className="tags has-addons">
                      <span className="tag">Block number</span>
                      <span className="tag is-link">{tx.blockNumber}</span>
                    </div>
                  </div>
                  <div className="control">
                    <div className="tags has-addons">
                      <span className="tag">Confirmations</span>
                      <span className="tag is-warning">{tx.confirmations} / 12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="columns is-multiline is-vcentered">
              <div className="column is-3">
                <p className="has-text-weight-bold">Tx hash:</p>
              </div>
              <div className="column">
                <p className="tag is-warning is-light">{tx.hash}</p>
              </div>
            </div>
            <div className="columns is-multiline is-vcentered">
              <div className="column is-3">
                <p className="has-text-weight-bold">HDWallet addres:</p>
              </div>
              <div className="column">
                <p className="tag is-warning is-light is-medium">{tx.to}</p>
              </div>
            </div>
            <div className="columns is-multiline is-vcentered">
              <div className="column is-3">
                <p className="has-text-weight-bold">Address from:</p>
              </div>
              <div className="column">
                <p className="tag is-warning is-light is-medium">{tx.from}</p>
              </div>
            </div>
            <div className="columns is-multiline is-vcentered">
              <div className="column is-3">
                <p className="has-text-weight-bold">ETH value:</p>
              </div>
              <div className="column">
                <p className="tag is-warning is-light is-medium">{tx.value}</p>
              </div>
            </div>
            <div className="columns is-multiline is-vcentered">
              <div className="column is-3">
                <p className="has-text-weight-bold">Date:</p>
              </div>
              <div className="column">
                <p className="tag is-warning is-light is-medium">{tx.timestamp}</p>
              </div>
            </div>
            <hr />
          </div>
        ))}
    </div>
  )
})
