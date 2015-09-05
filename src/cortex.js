module.exports = (function() {
  var cortexPubSub = require("./pubsub"),
      ImmutableWrapper = require("./immutable_wrapper")(cortexPubSub),
      ChangeHandler = require("./change_handler")(ImmutableWrapper);

  class Cortex extends ImmutableWrapper {
    constructor(value, callback) {
      super();

      this.__value = value;
      this.__path = [];
      this.__callbacks = callback ? [callback] : []
      this.__updating = false;
      this.__subscribe();

      this.__wrap();
    }

    update(diffs) {
      if(diffs.length) {
        if(!this.__updating) {
          this.__diffs = [];
          this.__diffSignature = {};
          this.__updating = true;
          setTimeout((this.__updateAll).bind(this), 0);
        }

        for(var i = 0, ii = diffs.length; i < ii; i++) {
          var sig = JSON.stringify(diffs[i]);

          if (diffs[i].force){
            this.__diffs.push(diffs[i]);
          } else if (!this.__diffSignature[sig]) {
            // Stringify to get diff signature as unique key to
            // prevent adding duplicate diffs.
            this.__diffSignature[sig] = true;
            this.__diffs.push(diffs[i]);
          }
        }
      }
    }

    onChange(callback) {
      this.__callbacks.push(callback);
    }

    __subscribe() {
      var self = this;
      this.__eventId = cortexPubSub.subscribeToCortex((function(topic, data) {
        this.update(data);
      }).bind(this));
    }

    __updateAll() {
      if(this.__diffs.length) {
        var updatedCortex = new Cortex();

        updatedCortex = ChangeHandler.updateNode({
          oldWrapper: this,
          root: updatedCortex,
          diffs: this.__diffs,
          eventId: updatedCortex.__eventId
        });

        this.__runCallbacks(updatedCortex);

        updatedCortex.__callbacks = this.__callbacks.slice();
        // this.__callbacks = [];
        this.__updating = false;
        delete this.__diffs;

        cortexPubSub.unsubscribeFromCortex(this.__eventId);
      }
    }

    __runCallbacks(updatedCortex) {
      for (var i = 0, ii = this.__callbacks.length; i < ii; i++) {
        if(this.__callbacks[i])
          this.__callbacks[i](updatedCortex);
      }
    }
  }

  if(typeof window !== "undefined" && window !== null) {
    window.Cortex = Cortex;
  }

  return Cortex;
})();