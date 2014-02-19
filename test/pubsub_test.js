var cortexPubSub = require("../src/pubsub"),
    updateCalled = false,
    removeCalled = false;

var updateCallback = function(topic, data) {
  updateCalled = true;
  console.log("update" + topic + data);
},
removeCallback = function(topic, data) {
  removeCalled = true;
  console.log("remove" + topic + data);
};

describe("PubSub", function() {
  beforeEach(function() {
    // Reset topics list before every test.
    cortexPubSub.topics = {};
    cortexPubSub.uid = -1;
    updateCalled = false;
    removeCalled = false;
  });

  describe("#subscribe", function() {
    it("adds callback to topics list", function() {
      var topic = "myTopic";
      cortexPubSub.subscribe(topic, updateCallback);

      expect(cortexPubSub.topics[topic]).toEqual([{callback: updateCallback}]);
    });
  });

  describe("#subscribeToCortex", function() {
    it("adds callbacks to topics list", function() {
      var topicId = cortexPubSub.subscribeToCortex(updateCallback, removeCallback);

      expect(cortexPubSub.topics["update" + topicId]).toEqual([{callback: updateCallback}]);
      expect(cortexPubSub.topics["remove" + topicId]).toEqual([{callback: removeCallback}]);
    });
  });

  describe("#unsubscribeFromCortex", function() {
    it("removes all update and remove topics with specified topic id", function() {
      var topicId = cortexPubSub.subscribeToCortex(updateCallback, removeCallback);
      cortexPubSub.unsubscribeFromCortex(topicId);

      expect(cortexPubSub.topics["update" + topicId]).toBe(undefined);
      expect(cortexPubSub.topics["remove" + topicId]).toBe(undefined);
    });
  });

  describe("#publish", function() {
    it("returns false when topic does not exists", function() {
      expect(cortexPubSub.publish("undefinedTopic", {})).toBe(false);
    });

    it("invokes update callback when update topic is published", function() {
      var data = {},
          topicId = cortexPubSub.subscribeToCortex(updateCallback, removeCallback),
          consoleLog = spyOn(console, "log");

      var topic = "update" + topicId;

      expect(cortexPubSub.publish(topic, data)).toBe(true);
      expect(updateCalled).toBe(true);
      expect(consoleLog).toHaveBeenCalledWith("update" + topic + data);
    });

    it("invokes remove callback when remove topic is published", function() {
      var data = {},
          topicId = cortexPubSub.subscribeToCortex(updateCallback, removeCallback),
          consoleLog = spyOn(console, "log");

      var topic = "remove" + topicId;

      expect(cortexPubSub.publish(topic, data)).toBe(true);
      expect(removeCalled).toBe(true);
      expect(consoleLog).toHaveBeenCalledWith("remove" + topic + data);
    });
  });
});
