module.exports = (function() {
  class PubSub {
    constructor() {
      this.uid = -1;
      this.topics = {};
    }

    subscribe(topic, callback) {
      if(!this.topics.hasOwnProperty(topic)) {
        this.topics[topic] = [];
      }
      this.topics[topic].push({callback: callback});
    }

    publish(topic, data) {
      if(!this.topics.hasOwnProperty(topic)) {
        return false;
      }

      var subscribers = this.topics[topic];

      for(var subscriber of subscribers) {
        subscriber.callback(topic, data);
      }

      return true;
    }

    subscribeToCortex(updateCallback, removeCallback) {
      this.uid += 1;
      this.subscribe("update" + this.uid, updateCallback);
      this.subscribe("remove" + this.uid, removeCallback);
      return this.uid;
    }

    unsubscribeFromCortex(topicId) {
      delete this.topics["update" + topicId];
      delete this.topics["remove" + topicId];
    }
  }

  return new PubSub();
})();
