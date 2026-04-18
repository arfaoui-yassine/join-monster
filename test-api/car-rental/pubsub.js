import { EventEmitter } from 'events'

// Simple PubSub for subscriptions
class PubSub {
  constructor() {
    this.ee = new EventEmitter()
    this.ee.setMaxListeners(100)
    this.subscriptions = {}
    this.subIdCounter = 0
  }

  publish(triggerName, payload) {
    this.ee.emit(triggerName, payload)
  }

  subscribe(triggerName, onMessage) {
    this.ee.on(triggerName, onMessage)
    this.subIdCounter++
    this.subscriptions[this.subIdCounter] = [triggerName, onMessage]
    return Promise.resolve(this.subIdCounter)
  }

  unsubscribe(subId) {
    const [triggerName, onMessage] = this.subscriptions[subId] || []
    if (triggerName) {
      this.ee.removeListener(triggerName, onMessage)
      delete this.subscriptions[subId]
    }
  }

  asyncIterator(triggers) {
    const pullQueue = []
    const pushQueue = []
    let listening = true

    const pushValue = (event) => {
      if (pullQueue.length > 0) {
        pullQueue.shift()({ value: event, done: false })
      } else {
        pushQueue.push(event)
      }
    }

    const pullValue = () => {
      return new Promise(resolve => {
        if (pushQueue.length > 0) {
          resolve({ value: pushQueue.shift(), done: false })
        } else {
          pullQueue.push(resolve)
        }
      })
    }

    const triggerArray = Array.isArray(triggers) ? triggers : [triggers]
    const subIds = []

    for (const trigger of triggerArray) {
      this.subscribe(trigger, pushValue).then(id => subIds.push(id))
    }

    return {
      next: () => listening ? pullValue() : Promise.resolve({ value: undefined, done: true }),
      return: () => {
        listening = false
        subIds.forEach(id => this.unsubscribe(id))
        for (const resolve of pullQueue) {
          resolve({ value: undefined, done: true })
        }
        return Promise.resolve({ value: undefined, done: true })
      },
      throw: (error) => {
        listening = false
        return Promise.reject(error)
      },
      [Symbol.asyncIterator]() {
        return this
      }
    }
  }
}

export const pubsub = new PubSub()

// Event names
export const EVENTS = {
  RESERVATION_CREATED: 'RESERVATION_CREATED',
  RESERVATION_STATUS_CHANGED: 'RESERVATION_STATUS_CHANGED',
  REVIEW_ADDED: 'REVIEW_ADDED',
  CAR_AVAILABILITY_CHANGED: 'CAR_AVAILABILITY_CHANGED'
}
