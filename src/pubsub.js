var PubSub = (function() {
  function PubSub() {
    this.uid = -1;
    this.topics = {};
  }

  PubSub.prototype.subscribe = function(topic, callback) {
    if(!this.topics.hasOwnProperty(topic)) {
      this.topics[topic] = [];
    }
    this.topics[topic].push({callback: callback});
  };


  PubSub.prototype.publish = function(topic, data) {
    if(!this.topics.hasOwnProperty(topic)) {
      return false;
    }

    var subscribers = this.topics[topic];
    var notify = function() {
      for(var i=0, ii=subscribers.length;i < ii;i++) {
        subscribers[i].callback(topic, data);
      }
    };

    notify();

    return true;
  };

  // Add both update and remove subscriptions with 1 call.
  // Return the unique id so each cortex can handle its own event id.
  PubSub.prototype.subscribeToCortex = function(updateCallback, removeCallback) {
    this.uid += 1;
    this.subscribe("update" + this.uid, updateCallback);
    this.subscribe("remove" + this.uid, removeCallback);
    return this.uid;
  };

  PubSub.prototype.unsubscribeFromCortex = function(topicId) {
    delete this.topics["update" + topicId];
    delete this.topics["remove" + topicId];
  };

  return PubSub;
})();

module.exports = new PubSub();
