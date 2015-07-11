var webAnimationsShared = {};

var webAnimations1 = {};

var webAnimationsNext = {};

if (!false) {
  var webAnimationsTesting = null;
}

(function(shared, testing) {
  var fills = "backwards|forwards|both|none".split("|");
  var directions = "reverse|alternate|alternate-reverse".split("|");
  function cloneTimingInput(timingInput) {
    if ("number" == typeof timingInput) {
      return timingInput;
    }
    var clone = {};
    for (var m in timingInput) {
      clone[m] = timingInput[m];
    }
    return clone;
  }
  function AnimationEffectTiming() {
    this._delay = 0;
    this._endDelay = 0;
    this._fill = "none";
    this._iterationStart = 0;
    this._iterations = 1;
    this._duration = 0;
    this._playbackRate = 1;
    this._direction = "normal";
    this._easing = "linear";
  }
  AnimationEffectTiming.prototype = {
    _setMember: function(member, value) {
      this["_" + member] = value;
      if (this._effect) {
        this._effect._timingInput[member] = value;
        this._effect._timing = shared.normalizeTimingInput(shared.normalizeTimingInput(this._effect._timingInput));
        this._effect.activeDuration = shared.calculateActiveDuration(this._effect._timing);
        if (this._effect._animation) {
          this._effect._animation._rebuildUnderlyingAnimation();
        }
      }
    },
    get playbackRate() {
      return this._playbackRate;
    },
    set delay(value) {
      this._setMember("delay", value);
    },
    get delay() {
      return this._delay;
    },
    set endDelay(value) {
      this._setMember("endDelay", value);
    },
    get endDelay() {
      return this._endDelay;
    },
    set fill(value) {
      this._setMember("fill", value);
    },
    get fill() {
      return this._fill;
    },
    set iterationStart(value) {
      this._setMember("iterationStart", value);
    },
    get iterationStart() {
      return this._iterationStart;
    },
    set duration(value) {
      this._setMember("duration", value);
    },
    get duration() {
      return this._duration;
    },
    set direction(value) {
      this._setMember("direction", value);
    },
    get direction() {
      return this._direction;
    },
    set easing(value) {
      this._setMember("easing", value);
    },
    get easing() {
      return this._easing;
    },
    set iterations(value) {
      this._setMember("iterations", value);
    },
    get iterations() {
      return this._iterations;
    }
  };
  function makeTiming(timingInput, forGroup, effect) {
    var timing = new AnimationEffectTiming();
    if (forGroup) {
      timing.fill = "both";
      timing.duration = "auto";
    }
    if ("number" == typeof timingInput && !isNaN(timingInput)) {
      timing.duration = timingInput;
    } else {
      if (void 0 !== timingInput) {
        Object.getOwnPropertyNames(timingInput).forEach(function(property) {
          if ("auto" != timingInput[property]) {
            if ("number" == typeof timing[property] || "duration" == property) {
              if ("number" != typeof timingInput[property] || isNaN(timingInput[property])) {
                return;
              }
            }
            if ("fill" == property && fills.indexOf(timingInput[property]) == -1) {
              return;
            }
            if ("direction" == property && directions.indexOf(timingInput[property]) == -1) {
              return;
            }
            if ("playbackRate" == property && 1 !== timingInput[property] && shared.isDeprecated("AnimationEffectTiming.playbackRate", "2014-11-28", "Use Animation.playbackRate instead.")) {
              return;
            }
            timing[property] = timingInput[property];
          }
        });
      }
    }
    return timing;
  }
  function numericTimingToObject(timingInput) {
    if ("number" == typeof timingInput) {
      if (isNaN(timingInput)) {
        timingInput = {
          duration: 0
        };
      } else {
        timingInput = {
          duration: timingInput
        };
      }
    }
    return timingInput;
  }
  function normalizeTimingInput(timingInput, forGroup) {
    timingInput = shared.numericTimingToObject(timingInput);
    var timing = makeTiming(timingInput, forGroup);
    timing._easing = toTimingFunction(timing.easing);
    return timing;
  }
  function cubic(a, b, c, d) {
    if (a < 0 || a > 1 || c < 0 || c > 1) {
      return linear;
    }
    return function(x) {
      if (0 == x || 1 == x) {
        return x;
      }
      var start = 0, end = 1;
      while (1) {
        var mid = (start + end) / 2;
        function f(a, b, m) {
          return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
        }
        var xEst = f(a, c, mid);
        if (Math.abs(x - xEst) < .001) {
          return f(b, d, mid);
        }
        if (xEst < x) {
          start = mid;
        } else {
          end = mid;
        }
      }
    };
  }
  var Start = 1;
  var Middle = .5;
  var End = 0;
  function step(count, pos) {
    return function(x) {
      if (x >= 1) {
        return 1;
      }
      var stepSize = 1 / count;
      x += pos * stepSize;
      return x - x % stepSize;
    };
  }
  var presets = {
    ease: cubic(.25, .1, .25, 1),
    "ease-in": cubic(.42, 0, 1, 1),
    "ease-out": cubic(0, 0, .58, 1),
    "ease-in-out": cubic(.42, 0, .58, 1),
    "step-start": step(1, Start),
    "step-middle": step(1, Middle),
    "step-end": step(1, End)
  };
  var numberString = "\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*";
  var cubicBezierRe = new RegExp("cubic-bezier\\(" + numberString + "," + numberString + "," + numberString + "," + numberString + "\\)");
  var stepRe = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/;
  var linear = function(x) {
    return x;
  };
  function toTimingFunction(easing) {
    var cubicData = cubicBezierRe.exec(easing);
    if (cubicData) {
      return cubic.apply(this, cubicData.slice(1).map(Number));
    }
    var stepData = stepRe.exec(easing);
    if (stepData) {
      return step(Number(stepData[1]), {
        start: Start,
        middle: Middle,
        end: End
      }[stepData[2]]);
    }
    var preset = presets[easing];
    if (preset) {
      return preset;
    }
    return linear;
  }
  function calculateActiveDuration(timing) {
    return Math.abs(repeatedDuration(timing) / timing.playbackRate);
  }
  function repeatedDuration(timing) {
    return timing.duration * timing.iterations;
  }
  var PhaseNone = 0;
  var PhaseBefore = 1;
  var PhaseAfter = 2;
  var PhaseActive = 3;
  function calculatePhase(activeDuration, localTime, timing) {
    if (null == localTime) {
      return PhaseNone;
    }
    if (localTime < timing.delay) {
      return PhaseBefore;
    }
    if (localTime >= timing.delay + activeDuration) {
      return PhaseAfter;
    }
    return PhaseActive;
  }
  function calculateActiveTime(activeDuration, fillMode, localTime, phase, delay) {
    switch (phase) {
     case PhaseBefore:
      if ("backwards" == fillMode || "both" == fillMode) {
        return 0;
      }
      return null;

     case PhaseActive:
      return localTime - delay;

     case PhaseAfter:
      if ("forwards" == fillMode || "both" == fillMode) {
        return activeDuration;
      }
      return null;

     case PhaseNone:
      return null;
    }
  }
  function calculateScaledActiveTime(activeDuration, activeTime, startOffset, timing) {
    return (timing.playbackRate < 0 ? activeTime - activeDuration : activeTime) * timing.playbackRate + startOffset;
  }
  function calculateIterationTime(iterationDuration, repeatedDuration, scaledActiveTime, startOffset, timing) {
    if (scaledActiveTime === 1 / 0 || scaledActiveTime === -(1 / 0) || scaledActiveTime - startOffset == repeatedDuration && timing.iterations && (timing.iterations + timing.iterationStart) % 1 == 0) {
      return iterationDuration;
    }
    return scaledActiveTime % iterationDuration;
  }
  function calculateCurrentIteration(iterationDuration, iterationTime, scaledActiveTime, timing) {
    if (0 === scaledActiveTime) {
      return 0;
    }
    if (iterationTime == iterationDuration) {
      return timing.iterationStart + timing.iterations - 1;
    }
    return Math.floor(scaledActiveTime / iterationDuration);
  }
  function calculateTransformedTime(currentIteration, iterationDuration, iterationTime, timing) {
    var currentIterationIsOdd = currentIteration % 2 >= 1;
    var currentDirectionIsForwards = "normal" == timing.direction || timing.direction == (currentIterationIsOdd ? "alternate-reverse" : "alternate");
    var directedTime = currentDirectionIsForwards ? iterationTime : iterationDuration - iterationTime;
    var timeFraction = directedTime / iterationDuration;
    return iterationDuration * timing.easing(timeFraction);
  }
  function calculateTimeFraction(activeDuration, localTime, timing) {
    var phase = calculatePhase(activeDuration, localTime, timing);
    var activeTime = calculateActiveTime(activeDuration, timing.fill, localTime, phase, timing.delay);
    if (null === activeTime) {
      return null;
    }
    if (0 === activeDuration) {
      return phase === PhaseBefore ? 0 : 1;
    }
    var startOffset = timing.iterationStart * timing.duration;
    var scaledActiveTime = calculateScaledActiveTime(activeDuration, activeTime, startOffset, timing);
    var iterationTime = calculateIterationTime(timing.duration, repeatedDuration(timing), scaledActiveTime, startOffset, timing);
    var currentIteration = calculateCurrentIteration(timing.duration, iterationTime, scaledActiveTime, timing);
    return calculateTransformedTime(currentIteration, timing.duration, iterationTime, timing) / timing.duration;
  }
  shared.cloneTimingInput = cloneTimingInput;
  shared.makeTiming = makeTiming;
  shared.numericTimingToObject = numericTimingToObject;
  shared.normalizeTimingInput = normalizeTimingInput;
  shared.calculateActiveDuration = calculateActiveDuration;
  shared.calculateTimeFraction = calculateTimeFraction;
  shared.calculatePhase = calculatePhase;
  shared.toTimingFunction = toTimingFunction;
  if (false) {
    testing.normalizeTimingInput = normalizeTimingInput;
    testing.toTimingFunction = toTimingFunction;
    testing.calculateActiveDuration = calculateActiveDuration;
    testing.calculatePhase = calculatePhase;
    testing.PhaseNone = PhaseNone;
    testing.PhaseBefore = PhaseBefore;
    testing.PhaseActive = PhaseActive;
    testing.PhaseAfter = PhaseAfter;
    testing.calculateActiveTime = calculateActiveTime;
    testing.calculateScaledActiveTime = calculateScaledActiveTime;
    testing.calculateIterationTime = calculateIterationTime;
    testing.calculateCurrentIteration = calculateCurrentIteration;
    testing.calculateTransformedTime = calculateTransformedTime;
  }
})(webAnimationsShared, webAnimationsTesting);

(function(shared, testing) {
  var shorthandToLonghand = {
    background: [ "backgroundImage", "backgroundPosition", "backgroundSize", "backgroundRepeat", "backgroundAttachment", "backgroundOrigin", "backgroundClip", "backgroundColor" ],
    border: [ "borderTopColor", "borderTopStyle", "borderTopWidth", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderBottomColor", "borderBottomStyle", "borderBottomWidth", "borderLeftColor", "borderLeftStyle", "borderLeftWidth" ],
    borderBottom: [ "borderBottomWidth", "borderBottomStyle", "borderBottomColor" ],
    borderColor: [ "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor" ],
    borderLeft: [ "borderLeftWidth", "borderLeftStyle", "borderLeftColor" ],
    borderRadius: [ "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius" ],
    borderRight: [ "borderRightWidth", "borderRightStyle", "borderRightColor" ],
    borderTop: [ "borderTopWidth", "borderTopStyle", "borderTopColor" ],
    borderWidth: [ "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth" ],
    flex: [ "flexGrow", "flexShrink", "flexBasis" ],
    font: [ "fontFamily", "fontSize", "fontStyle", "fontVariant", "fontWeight", "lineHeight" ],
    margin: [ "marginTop", "marginRight", "marginBottom", "marginLeft" ],
    outline: [ "outlineColor", "outlineStyle", "outlineWidth" ],
    padding: [ "paddingTop", "paddingRight", "paddingBottom", "paddingLeft" ]
  };
  var shorthandExpanderElem = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
  var borderWidthAliases = {
    thin: "1px",
    medium: "3px",
    thick: "5px"
  };
  var aliases = {
    borderBottomWidth: borderWidthAliases,
    borderLeftWidth: borderWidthAliases,
    borderRightWidth: borderWidthAliases,
    borderTopWidth: borderWidthAliases,
    fontSize: {
      "xx-small": "60%",
      "x-small": "75%",
      small: "89%",
      medium: "100%",
      large: "120%",
      "x-large": "150%",
      "xx-large": "200%"
    },
    fontWeight: {
      normal: "400",
      bold: "700"
    },
    outlineWidth: borderWidthAliases,
    textShadow: {
      none: "0px 0px 0px transparent"
    },
    boxShadow: {
      none: "0px 0px 0px 0px transparent"
    }
  };
  function antiAlias(property, value) {
    if (property in aliases) {
      return aliases[property][value] || value;
    }
    return value;
  }
  function expandShorthandAndAntiAlias(property, value, result) {
    var longProperties = shorthandToLonghand[property];
    if (longProperties) {
      shorthandExpanderElem.style[property] = value;
      for (var i in longProperties) {
        var longProperty = longProperties[i];
        var longhandValue = shorthandExpanderElem.style[longProperty];
        result[longProperty] = antiAlias(longProperty, longhandValue);
      }
    } else {
      result[property] = antiAlias(property, value);
    }
  }
  function normalizeKeyframes(effectInput) {
    if (!Array.isArray(effectInput) && null !== effectInput) {
      throw new TypeError("Keyframes must be null or an array of keyframes");
    }
    if (null == effectInput) {
      return [];
    }
    var keyframes = effectInput.map(function(originalKeyframe) {
      var keyframe = {};
      for (var member in originalKeyframe) {
        var memberValue = originalKeyframe[member];
        if ("offset" == member) {
          if (null != memberValue) {
            memberValue = Number(memberValue);
            if (!isFinite(memberValue)) {
              throw new TypeError("keyframe offsets must be numbers.");
            }
          }
        } else {
          if ("composite" == member) {
            throw {
              type: DOMException.NOT_SUPPORTED_ERR,
              name: "NotSupportedError",
              message: "add compositing is not supported"
            };
          } else {
            if ("easing" == member) {
              memberValue = shared.toTimingFunction(memberValue);
            } else {
              memberValue = "" + memberValue;
            }
          }
        }
        expandShorthandAndAntiAlias(member, memberValue, keyframe);
      }
      if (void 0 == keyframe.offset) {
        keyframe.offset = null;
      }
      if (void 0 == keyframe.easing) {
        keyframe.easing = shared.toTimingFunction("linear");
      }
      return keyframe;
    });
    var everyFrameHasOffset = true;
    var looselySortedByOffset = true;
    var previousOffset = -(1 / 0);
    for (var i = 0; i < keyframes.length; i++) {
      var offset = keyframes[i].offset;
      if (null != offset) {
        if (offset < previousOffset) {
          throw {
            code: DOMException.INVALID_MODIFICATION_ERR,
            name: "InvalidModificationError",
            message: "Keyframes are not loosely sorted by offset. Sort or specify offsets."
          };
        }
        previousOffset = offset;
      } else {
        everyFrameHasOffset = false;
      }
    }
    keyframes = keyframes.filter(function(keyframe) {
      return keyframe.offset >= 0 && keyframe.offset <= 1;
    });
    function spaceKeyframes() {
      var length = keyframes.length;
      if (null == keyframes[length - 1].offset) {
        keyframes[length - 1].offset = 1;
      }
      if (length > 1 && null == keyframes[0].offset) {
        keyframes[0].offset = 0;
      }
      var previousIndex = 0;
      var previousOffset = keyframes[0].offset;
      for (var i = 1; i < length; i++) {
        var offset = keyframes[i].offset;
        if (null != offset) {
          for (var j = 1; j < i - previousIndex; j++) {
            keyframes[previousIndex + j].offset = previousOffset + (offset - previousOffset) * j / (i - previousIndex);
          }
          previousIndex = i;
          previousOffset = offset;
        }
      }
    }
    if (!everyFrameHasOffset) {
      spaceKeyframes();
    }
    return keyframes;
  }
  shared.normalizeKeyframes = normalizeKeyframes;
  if (false) {
    testing.normalizeKeyframes = normalizeKeyframes;
  }
})(webAnimationsShared, webAnimationsTesting);

(function(shared) {
  var silenced = {};
  shared.isDeprecated = function(feature, date, advice, plural) {
    var auxVerb = plural ? "are" : "is";
    var today = new Date();
    var expiry = new Date(date);
    expiry.setMonth(expiry.getMonth() + 3);
    if (today < expiry) {
      if (!(feature in silenced)) {
        console.warn("Web Animations: " + feature + " " + auxVerb + " deprecated and will stop working on " + expiry.toDateString() + ". " + advice);
      }
      silenced[feature] = true;
      return false;
    } else {
      return true;
    }
  };
  shared.deprecated = function(feature, date, advice, plural) {
    var auxVerb = plural ? "are" : "is";
    if (shared.isDeprecated(feature, date, advice, plural)) {
      throw new Error(feature + " " + auxVerb + " no longer supported. " + advice);
    }
  };
})(webAnimationsShared);
//# sourceMappingURL=inter-web-animations-next-lite-preamble.js.map
(function() {
  if (document.documentElement.animate) {
    var player = document.documentElement.animate([], 0);
    var load = true;
    if (player) {
      load = false;
      "play|currentTime|pause|reverse|playbackRate|cancel|finish|startTime|playState".split("|").forEach(function(t) {
        if (player[t] === undefined) {
          load = true;
        }
      });
    }
    if (!load) { return; }  }
(function(shared, scope, testing) {
  scope.convertEffectInput = function(effectInput) {
    var keyframes = shared.normalizeKeyframes(effectInput);
    var propertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups(keyframes);
    var interpolations = makeInterpolations(propertySpecificKeyframeGroups);
    return function(target, fraction) {
      if (null != fraction) {
        interpolations.filter(function(interpolation) {
          return fraction <= 0 && 0 == interpolation.startTime || fraction >= 1 && 1 == interpolation.endTime || fraction >= interpolation.startTime && fraction <= interpolation.endTime;
        }).forEach(function(interpolation) {
          var offsetFraction = fraction - interpolation.startTime;
          var localDuration = interpolation.endTime - interpolation.startTime;
          var scaledLocalTime = 0 == localDuration ? 0 : interpolation.easing(offsetFraction / localDuration);
          scope.apply(target, interpolation.property, interpolation.interpolation(scaledLocalTime));
        });
      } else {
        for (var property in propertySpecificKeyframeGroups) {
          if ("offset" != property && "easing" != property && "composite" != property) {
            scope.clear(target, property);
          }
        }
      }
    };
  };
  function makePropertySpecificKeyframeGroups(keyframes) {
    var propertySpecificKeyframeGroups = {};
    for (var i = 0; i < keyframes.length; i++) {
      for (var member in keyframes[i]) {
        if ("offset" != member && "easing" != member && "composite" != member) {
          var propertySpecificKeyframe = {
            offset: keyframes[i].offset,
            easing: keyframes[i].easing,
            value: keyframes[i][member]
          };
          propertySpecificKeyframeGroups[member] = propertySpecificKeyframeGroups[member] || [];
          propertySpecificKeyframeGroups[member].push(propertySpecificKeyframe);
        }
      }
    }
    for (var groupName in propertySpecificKeyframeGroups) {
      var group = propertySpecificKeyframeGroups[groupName];
      if (0 != group[0].offset || 1 != group[group.length - 1].offset) {
        throw {
          type: DOMException.NOT_SUPPORTED_ERR,
          name: "NotSupportedError",
          message: "Partial keyframes are not supported"
        };
      }
    }
    return propertySpecificKeyframeGroups;
  }
  function makeInterpolations(propertySpecificKeyframeGroups) {
    var interpolations = [];
    for (var groupName in propertySpecificKeyframeGroups) {
      var group = propertySpecificKeyframeGroups[groupName];
      for (var i = 0; i < group.length - 1; i++) {
        var startTime = group[i].offset;
        var endTime = group[i + 1].offset;
        var startValue = group[i].value;
        var endValue = group[i + 1].value;
        if (startTime == endTime) {
          if (1 == endTime) {
            startValue = endValue;
          } else {
            endValue = startValue;
          }
        }
        interpolations.push({
          startTime: startTime,
          endTime: endTime,
          easing: group[i].easing,
          property: groupName,
          interpolation: scope.propertyInterpolation(groupName, startValue, endValue)
        });
      }
    }
    interpolations.sort(function(leftInterpolation, rightInterpolation) {
      return leftInterpolation.startTime - rightInterpolation.startTime;
    });
    return interpolations;
  }
  if (false) {
    testing.makePropertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups;
    testing.makeInterpolations = makeInterpolations;
  }
})(webAnimationsShared, webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  var propertyHandlers = {};
  function addPropertyHandler(parser, merger, property) {
    propertyHandlers[property] = propertyHandlers[property] || [];
    propertyHandlers[property].push([ parser, merger ]);
  }
  function addPropertiesHandler(parser, merger, properties) {
    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      false && console.assert(property.toLowerCase() === property);
      addPropertyHandler(parser, merger, property);
      if (/-/.test(property)) {
        addPropertyHandler(parser, merger, property.replace(/-(.)/g, function(_, c) {
          return c.toUpperCase();
        }));
      }
    }
  }
  scope.addPropertiesHandler = addPropertiesHandler;
  var initialValues = {
    backgroundColor: "transparent",
    backgroundPosition: "0% 0%",
    borderBottomColor: "currentColor",
    borderBottomLeftRadius: "0px",
    borderBottomRightRadius: "0px",
    borderBottomWidth: "3px",
    borderLeftColor: "currentColor",
    borderLeftWidth: "3px",
    borderRightColor: "currentColor",
    borderRightWidth: "3px",
    borderSpacing: "2px",
    borderTopColor: "currentColor",
    borderTopLeftRadius: "0px",
    borderTopRightRadius: "0px",
    borderTopWidth: "3px",
    bottom: "auto",
    clip: "rect(0px, 0px, 0px, 0px)",
    color: "black",
    fontSize: "100%",
    fontWeight: "400",
    height: "auto",
    left: "auto",
    letterSpacing: "normal",
    lineHeight: "120%",
    marginBottom: "0px",
    marginLeft: "0px",
    marginRight: "0px",
    marginTop: "0px",
    maxHeight: "none",
    maxWidth: "none",
    minHeight: "0px",
    minWidth: "0px",
    opacity: "1.0",
    outlineColor: "invert",
    outlineOffset: "0px",
    outlineWidth: "3px",
    paddingBottom: "0px",
    paddingLeft: "0px",
    paddingRight: "0px",
    paddingTop: "0px",
    right: "auto",
    textIndent: "0px",
    textShadow: "0px 0px 0px transparent",
    top: "auto",
    transform: "",
    verticalAlign: "0px",
    visibility: "visible",
    width: "auto",
    wordSpacing: "normal",
    zIndex: "auto"
  };
  function propertyInterpolation(property, left, right) {
    if ("initial" == left || "initial" == right) {
      var ucProperty = property.replace(/-(.)/g, function(_, c) {
        return c.toUpperCase();
      });
      if ("initial" == left) {
        left = initialValues[ucProperty];
      }
      if ("initial" == right) {
        right = initialValues[ucProperty];
      }
    }
    var handlers = left == right ? [] : propertyHandlers[property];
    for (var i = 0; handlers && i < handlers.length; i++) {
      var parsedLeft = handlers[i][0](left);
      var parsedRight = handlers[i][0](right);
      if (void 0 !== parsedLeft && void 0 !== parsedRight) {
        var interpolationArgs = handlers[i][1](parsedLeft, parsedRight);
        if (interpolationArgs) {
          var interp = scope.Interpolation.apply(null, interpolationArgs);
          return function(t) {
            if (0 == t) {
              return left;
            }
            if (1 == t) {
              return right;
            }
            return interp(t);
          };
        }
      }
    }
    return scope.Interpolation(false, true, function(bool) {
      return bool ? right : left;
    });
  }
  scope.propertyInterpolation = propertyInterpolation;
})(webAnimations1, webAnimationsTesting);

(function(shared, scope, testing) {
  function EffectTime(timing) {
    var timeFraction = 0;
    var activeDuration = shared.calculateActiveDuration(timing);
    var effectTime = function(localTime) {
      return shared.calculateTimeFraction(activeDuration, localTime, timing);
    };
    effectTime._totalDuration = timing.delay + activeDuration + timing.endDelay;
    effectTime._isCurrent = function(localTime) {
      var phase = shared.calculatePhase(activeDuration, localTime, timing);
      return phase === PhaseActive || phase === PhaseBefore;
    };
    return effectTime;
  }
  scope.KeyframeEffect = function(target, effectInput, timingInput) {
    var effectTime = EffectTime(shared.normalizeTimingInput(timingInput));
    var interpolations = scope.convertEffectInput(effectInput);
    var timeFraction;
    var keyframeEffect = function() {
      false && console.assert("undefined" !== typeof timeFraction);
      interpolations(target, timeFraction);
    };
    keyframeEffect._update = function(localTime) {
      timeFraction = effectTime(localTime);
      return null !== timeFraction;
    };
    keyframeEffect._clear = function() {
      interpolations(target, null);
    };
    keyframeEffect._hasSameTarget = function(otherTarget) {
      return target === otherTarget;
    };
    keyframeEffect._isCurrent = effectTime._isCurrent;
    keyframeEffect._totalDuration = effectTime._totalDuration;
    return keyframeEffect;
  };
  scope.NullEffect = function(clear) {
    var nullEffect = function() {
      if (clear) {
        clear();
        clear = null;
      }
    };
    nullEffect._update = function() {
      return null;
    };
    nullEffect._totalDuration = 0;
    nullEffect._isCurrent = function() {
      return false;
    };
    nullEffect._hasSameTarget = function() {
      return false;
    };
    return nullEffect;
  };
  if (false) {
    testing.webAnimations1KeyframeEffect = scope.KeyframeEffect;
    testing.effectTime = EffectTime;
  }
})(webAnimationsShared, webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  scope.apply = function(element, property, value) {
    element.style[scope.propertyName(property)] = value;
  };
  scope.clear = function(element, property) {
    element.style[scope.propertyName(property)] = "";
  };
})(webAnimations1, webAnimationsTesting);

(function(scope) {
  window.Element.prototype.animate = function(effectInput, timingInput) {
    return scope.timeline._play(scope.KeyframeEffect(this, effectInput, timingInput));
  };
})(webAnimations1);

(function(scope, testing) {
  function interpolate(from, to, f) {
    if ("number" == typeof from && "number" == typeof to) {
      return from * (1 - f) + to * f;
    }
    if ("boolean" == typeof from && "boolean" == typeof to) {
      return f < .5 ? from : to;
    }
    false && console.assert(Array.isArray(from) && Array.isArray(to), "If interpolation arguments are not numbers or bools they must be arrays");
    if (from.length == to.length) {
      var r = [];
      for (var i = 0; i < from.length; i++) {
        r.push(interpolate(from[i], to[i], f));
      }
      return r;
    }
    throw "Mismatched interpolation arguments " + from + ":" + to;
  }
  scope.Interpolation = function(from, to, convertToString) {
    return function(f) {
      return convertToString(interpolate(from, to, f));
    };
  };
  if (false) {
    testing.interpolate = interpolate;
  }
})(webAnimations1, webAnimationsTesting);

(function(shared, scope, testing) {
  shared.sequenceNumber = 0;
  var AnimationEvent = function(target, currentTime, timelineTime) {
    this.target = target;
    this.currentTime = currentTime;
    this.timelineTime = timelineTime;
    this.type = "finish";
    this.bubbles = false;
    this.cancelable = false;
    this.currentTarget = target;
    this.defaultPrevented = false;
    this.eventPhase = Event.AT_TARGET;
    this.timeStamp = Date.now();
  };
  scope.Animation = function(effect) {
    this._sequenceNumber = shared.sequenceNumber++;
    this._currentTime = 0;
    this._startTime = null;
    this._paused = false;
    this._playbackRate = 1;
    this._inTimeline = true;
    this._finishedFlag = false;
    this.onfinish = null;
    this._finishHandlers = [];
    this._effect = effect;
    this._inEffect = this._effect._update(0);
    this._idle = true;
    this._currentTimePending = false;
  };
  scope.Animation.prototype = {
    _ensureAlive: function() {
      if (this.playbackRate < 0 && 0 === this.currentTime) {
        this._inEffect = this._effect._update(-1);
      } else {
        this._inEffect = this._effect._update(this.currentTime);
      }
      if (!this._inTimeline && (this._inEffect || !this._finishedFlag)) {
        this._inTimeline = true;
        scope.timeline._animations.push(this);
      }
    },
    _tickCurrentTime: function(newTime, ignoreLimit) {
      if (newTime != this._currentTime) {
        this._currentTime = newTime;
        if (this._isFinished && !ignoreLimit) {
          this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
        }
        this._ensureAlive();
      }
    },
    get currentTime() {
      if (this._idle || this._currentTimePending) {
        return null;
      }
      return this._currentTime;
    },
    set currentTime(newTime) {
      newTime = +newTime;
      if (isNaN(newTime)) {
        return;
      }
      scope.restart();
      if (!this._paused && null != this._startTime) {
        this._startTime = this._timeline.currentTime - newTime / this._playbackRate;
      }
      this._currentTimePending = false;
      if (this._currentTime == newTime) {
        return;
      }
      this._tickCurrentTime(newTime, true);
      scope.invalidateEffects();
    },
    get startTime() {
      return this._startTime;
    },
    set startTime(newTime) {
      newTime = +newTime;
      if (isNaN(newTime)) {
        return;
      }
      if (this._paused || this._idle) {
        return;
      }
      this._startTime = newTime;
      this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate);
      scope.invalidateEffects();
    },
    get playbackRate() {
      return this._playbackRate;
    },
    set playbackRate(value) {
      if (value == this._playbackRate) {
        return;
      }
      var oldCurrentTime = this.currentTime;
      this._playbackRate = value;
      this._startTime = null;
      if ("paused" != this.playState && "idle" != this.playState) {
        this.play();
      }
      if (null != oldCurrentTime) {
        this.currentTime = oldCurrentTime;
      }
    },
    get _isFinished() {
      return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration || this._playbackRate < 0 && this._currentTime <= 0);
    },
    get _totalDuration() {
      return this._effect._totalDuration;
    },
    get playState() {
      if (this._idle) {
        return "idle";
      }
      if (null == this._startTime && !this._paused && 0 != this.playbackRate || this._currentTimePending) {
        return "pending";
      }
      if (this._paused) {
        return "paused";
      }
      if (this._isFinished) {
        return "finished";
      }
      return "running";
    },
    play: function() {
      this._paused = false;
      if (this._isFinished || this._idle) {
        this._currentTime = this._playbackRate > 0 ? 0 : this._totalDuration;
        this._startTime = null;
        scope.invalidateEffects();
      }
      this._finishedFlag = false;
      scope.restart();
      this._idle = false;
      this._ensureAlive();
    },
    pause: function() {
      if (!this._isFinished && !this._paused && !this._idle) {
        this._currentTimePending = true;
      }
      this._startTime = null;
      this._paused = true;
    },
    finish: function() {
      if (this._idle) {
        return;
      }
      this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
      this._startTime = this._totalDuration - this.currentTime;
      this._currentTimePending = false;
    },
    cancel: function() {
      if (!this._inEffect) {
        return;
      }
      this._inEffect = false;
      this._idle = true;
      this.currentTime = 0;
      this._startTime = null;
      this._effect._update(null);
      scope.invalidateEffects();
      scope.restart();
    },
    reverse: function() {
      this.playbackRate *= -1;
      this.play();
    },
    addEventListener: function(type, handler) {
      if ("function" == typeof handler && "finish" == type) {
        this._finishHandlers.push(handler);
      }
    },
    removeEventListener: function(type, handler) {
      if ("finish" != type) {
        return;
      }
      var index = this._finishHandlers.indexOf(handler);
      if (index >= 0) {
        this._finishHandlers.splice(index, 1);
      }
    },
    _fireEvents: function(baseTime) {
      var finished = this._isFinished;
      if ((finished || this._idle) && !this._finishedFlag) {
        var event = new AnimationEvent(this, this._currentTime, baseTime);
        var handlers = this._finishHandlers.concat(this.onfinish ? [ this.onfinish ] : []);
        setTimeout(function() {
          handlers.forEach(function(handler) {
            handler.call(event.target, event);
          });
        }, 0);
      }
      this._finishedFlag = finished;
    },
    _tick: function(timelineTime) {
      if (!this._idle && !this._paused) {
        if (null == this._startTime) {
          this.startTime = timelineTime - this._currentTime / this.playbackRate;
        } else {
          if (!this._isFinished) {
            this._tickCurrentTime((timelineTime - this._startTime) * this.playbackRate);
          }
        }
      }
      this._currentTimePending = false;
      this._fireEvents(timelineTime);
      return !this._idle && (this._inEffect || !this._finishedFlag);
    }
  };
  if (false) {
    testing.webAnimations1Animation = scope.Animation;
  }
})(webAnimationsShared, webAnimations1, webAnimationsTesting);

(function(shared, scope, testing) {
  var originalRequestAnimationFrame = window.requestAnimationFrame;
  var rafCallbacks = [];
  var rafId = 0;
  window.requestAnimationFrame = function(f) {
    var id = rafId++;
    if (0 == rafCallbacks.length && !false) {
      originalRequestAnimationFrame(processRafCallbacks);
    }
    rafCallbacks.push([ id, f ]);
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    rafCallbacks.forEach(function(entry) {
      if (entry[0] == id) {
        entry[1] = function() {};
      }
    });
  };
  function processRafCallbacks(t) {
    var processing = rafCallbacks;
    rafCallbacks = [];
    if (t < timeline.currentTime) {
      t = timeline.currentTime;
    }
    tick(t);
    processing.forEach(function(entry) {
      entry[1](t);
    });
    if (needsRetick) {
      tick(t);
    }
    applyPendingEffects();
    _now = void 0;
  }
  function compareAnimations(leftAnimation, rightAnimation) {
    return leftAnimation._sequenceNumber - rightAnimation._sequenceNumber;
  }
  function InternalTimeline() {
    this._animations = [];
    this.currentTime = window.performance && performance.now ? performance.now() : 0;
  }
  InternalTimeline.prototype = {
    _play: function(effect) {
      effect._timing = shared.normalizeTimingInput(effect.timing);
      var animation = new scope.Animation(effect);
      animation._idle = false;
      animation._timeline = this;
      this._animations.push(animation);
      scope.restart();
      scope.invalidateEffects();
      return animation;
    }
  };
  var _now = void 0;
  if (false) {
    var now = function() {
      return timeline.currentTime;
    };
  } else {
    var now = function() {
      if (void 0 == _now) {
        _now = performance.now();
      }
      return _now;
    };
  }
  var ticking = false;
  var hasRestartedThisFrame = false;
  scope.restart = function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function() {});
      hasRestartedThisFrame = true;
    }
    return hasRestartedThisFrame;
  };
  var needsRetick = false;
  scope.invalidateEffects = function() {
    needsRetick = true;
  };
  var pendingEffects = [];
  function applyPendingEffects() {
    pendingEffects.forEach(function(f) {
      f();
    });
    pendingEffects.length = 0;
  }
  var t60hz = 1e3 / 60;
  var originalGetComputedStyle = window.getComputedStyle;
  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    enumerable: true,
    value: function() {
      if (needsRetick) {
        var time = now();
        if (time - timeline.currentTime > 0) {
          timeline.currentTime += t60hz * (Math.floor((time - timeline.currentTime) / t60hz) + 1);
        }
        tick(timeline.currentTime);
      }
      applyPendingEffects();
      return originalGetComputedStyle.apply(this, arguments);
    }
  });
  function tick(t) {
    hasRestartedThisFrame = false;
    var timeline = scope.timeline;
    timeline.currentTime = t;
    timeline._animations.sort(compareAnimations);
    ticking = false;
    var updatingAnimations = timeline._animations;
    timeline._animations = [];
    var newPendingClears = [];
    var newPendingEffects = [];
    updatingAnimations = updatingAnimations.filter(function(animation) {
      animation._inTimeline = animation._tick(t);
      if (!animation._inEffect) {
        newPendingClears.push(animation._effect);
      } else {
        newPendingEffects.push(animation._effect);
      }
      if (!animation._isFinished && !animation._paused && !animation._idle) {
        ticking = true;
      }
      return animation._inTimeline;
    });
    pendingEffects.push.apply(pendingEffects, newPendingClears);
    pendingEffects.push.apply(pendingEffects, newPendingEffects);
    timeline._animations.push.apply(timeline._animations, updatingAnimations);
    needsRetick = false;
    if (ticking) {
      requestAnimationFrame(function() {});
    }
  }
  if (false) {
    testing.tick = function(t) {
      timeline.currentTime = t;
      processRafCallbacks(t);
    };
    testing.isTicking = function() {
      return ticking;
    };
    testing.setTicking = function(newVal) {
      ticking = newVal;
    };
  }
  var timeline = new InternalTimeline();
  scope.timeline = timeline;
})(webAnimationsShared, webAnimations1, webAnimationsTesting);

(function(scope) {
  function consumeToken(regex, string) {
    var result = regex.exec(string);
    if (result) {
      result = regex.ignoreCase ? result[0].toLowerCase() : result[0];
      return [ result, string.substr(result.length) ];
    }
  }
  function consumeTrimmed(consumer, string) {
    string = string.replace(/^\s*/, "");
    var result = consumer(string);
    if (result) {
      return [ result[0], result[1].replace(/^\s*/, "") ];
    }
  }
  function consumeRepeated(consumer, separator, string) {
    consumer = consumeTrimmed.bind(null, consumer);
    var list = [];
    while (true) {
      var result = consumer(string);
      if (!result) {
        return [ list, string ];
      }
      list.push(result[0]);
      string = result[1];
      result = consumeToken(separator, string);
      if (!result || "" == result[1]) {
        return [ list, string ];
      }
      string = result[1];
    }
  }
  function consumeParenthesised(parser, string) {
    var nesting = 0;
    for (var n = 0; n < string.length; n++) {
      if (/\s|,/.test(string[n]) && 0 == nesting) {
        break;
      } else {
        if ("(" == string[n]) {
          nesting++;
        } else {
          if (")" == string[n]) {
            nesting--;
            if (0 == nesting) {
              n++;
            }
            if (nesting <= 0) {
              break;
            }
          }
        }
      }
    }
    var parsed = parser(string.substr(0, n));
    return void 0 == parsed ? void 0 : [ parsed, string.substr(n) ];
  }
  function lcm(a, b) {
    var c = a;
    var d = b;
    while (c && d) {
      c > d ? c %= d : d %= c;
    }
    c = a * b / (c + d);
    return c;
  }
  function ignore(value) {
    return function(input) {
      var result = value(input);
      if (result) {
        result[0] = void 0;
      }
      return result;
    };
  }
  function optional(value, defaultValue) {
    return function(input) {
      var result = value(input);
      if (result) {
        return result;
      }
      return [ defaultValue, input ];
    };
  }
  function consumeList(list, input) {
    var output = [];
    for (var i = 0; i < list.length; i++) {
      var result = scope.consumeTrimmed(list[i], input);
      if (!result || "" == result[0]) {
        return;
      }
      if (void 0 !== result[0]) {
        output.push(result[0]);
      }
      input = result[1];
    }
    if ("" == input) {
      return output;
    }
  }
  function mergeWrappedNestedRepeated(wrap, nestedMerge, separator, left, right) {
    var matchingLeft = [];
    var matchingRight = [];
    var reconsititution = [];
    var length = lcm(left.length, right.length);
    for (var i = 0; i < length; i++) {
      var thing = nestedMerge(left[i % left.length], right[i % right.length]);
      if (!thing) {
        return;
      }
      matchingLeft.push(thing[0]);
      matchingRight.push(thing[1]);
      reconsititution.push(thing[2]);
    }
    return [ matchingLeft, matchingRight, function(positions) {
      var result = positions.map(function(position, i) {
        return reconsititution[i](position);
      }).join(separator);
      return wrap ? wrap(result) : result;
    } ];
  }
  function mergeList(left, right, list) {
    var lefts = [];
    var rights = [];
    var functions = [];
    var j = 0;
    for (var i = 0; i < list.length; i++) {
      if ("function" == typeof list[i]) {
        var result = list[i](left[j], right[j++]);
        lefts.push(result[0]);
        rights.push(result[1]);
        functions.push(result[2]);
      } else {
        (function(pos) {
          lefts.push(false);
          rights.push(false);
          functions.push(function() {
            return list[pos];
          });
        })(i);
      }
    }
    return [ lefts, rights, function(results) {
      var result = "";
      for (var i = 0; i < results.length; i++) {
        result += functions[i](results[i]);
      }
      return result;
    } ];
  }
  scope.consumeToken = consumeToken;
  scope.consumeTrimmed = consumeTrimmed;
  scope.consumeRepeated = consumeRepeated;
  scope.consumeParenthesised = consumeParenthesised;
  scope.ignore = ignore;
  scope.optional = optional;
  scope.consumeList = consumeList;
  scope.mergeNestedRepeated = mergeWrappedNestedRepeated.bind(null, null);
  scope.mergeWrappedNestedRepeated = mergeWrappedNestedRepeated;
  scope.mergeList = mergeList;
})(webAnimations1);

(function(scope) {
  function consumeShadow(string) {
    var shadow = {
      inset: false,
      lengths: [],
      color: null
    };
    function consumePart(string) {
      var result = scope.consumeToken(/^inset/i, string);
      if (result) {
        shadow.inset = true;
        return result;
      }
      var result = scope.consumeLengthOrPercent(string);
      if (result) {
        shadow.lengths.push(result[0]);
        return result;
      }
      var result = scope.consumeColor(string);
      if (result) {
        shadow.color = result[0];
        return result;
      }
    }
    var result = scope.consumeRepeated(consumePart, /^/, string);
    if (result && result[0].length) {
      return [ shadow, result[1] ];
    }
  }
  function parseShadowList(string) {
    var result = scope.consumeRepeated(consumeShadow, /^,/, string);
    if (result && "" == result[1]) {
      return result[0];
    }
  }
  function mergeShadow(left, right) {
    while (left.lengths.length < Math.max(left.lengths.length, right.lengths.length)) {
      left.lengths.push({
        px: 0
      });
    }
    while (right.lengths.length < Math.max(left.lengths.length, right.lengths.length)) {
      right.lengths.push({
        px: 0
      });
    }
    if (left.inset != right.inset || !!left.color != !!right.color) {
      return;
    }
    var lengthReconstitution = [];
    var colorReconstitution;
    var matchingLeft = [ [], 0 ];
    var matchingRight = [ [], 0 ];
    for (var i = 0; i < left.lengths.length; i++) {
      var mergedDimensions = scope.mergeDimensions(left.lengths[i], right.lengths[i], 2 == i);
      matchingLeft[0].push(mergedDimensions[0]);
      matchingRight[0].push(mergedDimensions[1]);
      lengthReconstitution.push(mergedDimensions[2]);
    }
    if (left.color && right.color) {
      var mergedColor = scope.mergeColors(left.color, right.color);
      matchingLeft[1] = mergedColor[0];
      matchingRight[1] = mergedColor[1];
      colorReconstitution = mergedColor[2];
    }
    return [ matchingLeft, matchingRight, function(value) {
      var result = left.inset ? "inset " : " ";
      for (var i = 0; i < lengthReconstitution.length; i++) {
        result += lengthReconstitution[i](value[0][i]) + " ";
      }
      if (colorReconstitution) {
        result += colorReconstitution(value[1]);
      }
      return result;
    } ];
  }
  function mergeNestedRepeatedShadow(nestedMerge, separator, left, right) {
    var leftCopy = [];
    var rightCopy = [];
    function defaultShadow(inset) {
      return {
        inset: inset,
        color: [ 0, 0, 0, 0 ],
        lengths: [ {
          px: 0
        }, {
          px: 0
        }, {
          px: 0
        }, {
          px: 0
        } ]
      };
    }
    for (var i = 0; i < left.length || i < right.length; i++) {
      var l = left[i] || defaultShadow(right[i].inset);
      var r = right[i] || defaultShadow(left[i].inset);
      leftCopy.push(l);
      rightCopy.push(r);
    }
    return scope.mergeNestedRepeated(nestedMerge, separator, leftCopy, rightCopy);
  }
  var mergeShadowList = mergeNestedRepeatedShadow.bind(null, mergeShadow, ", ");
  scope.addPropertiesHandler(parseShadowList, mergeShadowList, [ "box-shadow", "text-shadow" ]);
})(webAnimations1);

(function(scope, testing) {
  function numberToString(x) {
    return x.toFixed(3).replace(".000", "");
  }
  function clamp(min, max, x) {
    return Math.min(max, Math.max(min, x));
  }
  function parseNumber(string) {
    if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(string)) {
      return Number(string);
    }
  }
  function mergeNumbers(left, right) {
    return [ left, right, numberToString ];
  }
  function mergeFlex(left, right) {
    if (0 == left) {
      return;
    }
    return clampedMergeNumbers(0, 1 / 0)(left, right);
  }
  function mergePositiveIntegers(left, right) {
    return [ left, right, function(x) {
      return Math.round(clamp(1, 1 / 0, x));
    } ];
  }
  function clampedMergeNumbers(min, max) {
    return function(left, right) {
      return [ left, right, function(x) {
        return numberToString(clamp(min, max, x));
      } ];
    };
  }
  function round(left, right) {
    return [ left, right, Math.round ];
  }
  scope.clamp = clamp;
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, 1 / 0), [ "border-image-width", "line-height" ]);
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, 1), [ "opacity", "shape-image-threshold" ]);
  scope.addPropertiesHandler(parseNumber, mergeFlex, [ "flex-grow", "flex-shrink" ]);
  scope.addPropertiesHandler(parseNumber, mergePositiveIntegers, [ "orphans", "widows" ]);
  scope.addPropertiesHandler(parseNumber, round, [ "z-index" ]);
  scope.parseNumber = parseNumber;
  scope.mergeNumbers = mergeNumbers;
  scope.numberToString = numberToString;
})(webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  function merge(left, right) {
    if ("visible" != left && "visible" != right) {
      return;
    }
    return [ 0, 1, function(x) {
      if (x <= 0) {
        return left;
      }
      if (x >= 1) {
        return right;
      }
      return "visible";
    } ];
  }
  scope.addPropertiesHandler(String, merge, [ "visibility" ]);
})(webAnimations1);

(function(scope, testing) {
  var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
  canvas.width = canvas.height = 1;
  var context = canvas.getContext("2d");
  function parseColor(string) {
    string = string.trim();
    context.fillStyle = "#000";
    context.fillStyle = string;
    var contextSerializedFillStyle = context.fillStyle;
    context.fillStyle = "#fff";
    context.fillStyle = string;
    if (contextSerializedFillStyle != context.fillStyle) {
      return;
    }
    context.fillRect(0, 0, 1, 1);
    var pixelColor = context.getImageData(0, 0, 1, 1).data;
    context.clearRect(0, 0, 1, 1);
    var alpha = pixelColor[3] / 255;
    return [ pixelColor[0] * alpha, pixelColor[1] * alpha, pixelColor[2] * alpha, alpha ];
  }
  function mergeColors(left, right) {
    return [ left, right, function(x) {
      function clamp(v) {
        return Math.max(0, Math.min(255, v));
      }
      if (x[3]) {
        for (var i = 0; i < 3; i++) {
          x[i] = Math.round(clamp(x[i] / x[3]));
        }
      }
      x[3] = scope.numberToString(scope.clamp(0, 1, x[3]));
      return "rgba(" + x.join(",") + ")";
    } ];
  }
  scope.addPropertiesHandler(parseColor, mergeColors, [ "background-color", "border-bottom-color", "border-left-color", "border-right-color", "border-top-color", "color", "outline-color", "text-decoration-color" ]);
  scope.consumeColor = scope.consumeParenthesised.bind(null, parseColor);
  scope.mergeColors = mergeColors;
  if (false) {
    testing.parseColor = parseColor;
  }
})(webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  function parseDimension(unitRegExp, string) {
    string = string.trim().toLowerCase();
    if ("0" == string && "px".search(unitRegExp) >= 0) {
      return {
        px: 0
      };
    }
    if (!/^[^(]*$|^calc/.test(string)) {
      return;
    }
    string = string.replace(/calc\(/g, "(");
    var matchedUnits = {};
    string = string.replace(unitRegExp, function(match) {
      matchedUnits[match] = null;
      return "U" + match;
    });
    var taggedUnitRegExp = "U(" + unitRegExp.source + ")";
    var typeCheck = string.replace(/[-+]?(\d*\.)?\d+/g, "N").replace(new RegExp("N" + taggedUnitRegExp, "g"), "D").replace(/\s[+-]\s/g, "O").replace(/\s/g, "");
    var reductions = [ /N\*(D)/g, /(N|D)[*\/]N/g, /(N|D)O\1/g, /\((N|D)\)/g ];
    var i = 0;
    while (i < reductions.length) {
      if (reductions[i].test(typeCheck)) {
        typeCheck = typeCheck.replace(reductions[i], "$1");
        i = 0;
      } else {
        i++;
      }
    }
    if ("D" != typeCheck) {
      return;
    }
    for (var unit in matchedUnits) {
      var result = eval(string.replace(new RegExp("U" + unit, "g"), "").replace(new RegExp(taggedUnitRegExp, "g"), "*0"));
      if (!isFinite(result)) {
        return;
      }
      matchedUnits[unit] = result;
    }
    return matchedUnits;
  }
  function mergeDimensionsNonNegative(left, right) {
    return mergeDimensions(left, right, true);
  }
  function mergeDimensions(left, right, nonNegative) {
    var units = [], unit;
    for (unit in left) {
      units.push(unit);
    }
    for (unit in right) {
      if (units.indexOf(unit) < 0) {
        units.push(unit);
      }
    }
    left = units.map(function(unit) {
      return left[unit] || 0;
    });
    right = units.map(function(unit) {
      return right[unit] || 0;
    });
    return [ left, right, function(values) {
      var result = values.map(function(value, i) {
        if (1 == values.length && nonNegative) {
          value = Math.max(value, 0);
        }
        return scope.numberToString(value) + units[i];
      }).join(" + ");
      return values.length > 1 ? "calc(" + result + ")" : result;
    } ];
  }
  var lengthUnits = "px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc";
  var parseLength = parseDimension.bind(null, new RegExp(lengthUnits, "g"));
  var parseLengthOrPercent = parseDimension.bind(null, new RegExp(lengthUnits + "|%", "g"));
  var parseAngle = parseDimension.bind(null, /deg|rad|grad|turn/g);
  scope.parseLength = parseLength;
  scope.parseLengthOrPercent = parseLengthOrPercent;
  scope.consumeLengthOrPercent = scope.consumeParenthesised.bind(null, parseLengthOrPercent);
  scope.parseAngle = parseAngle;
  scope.mergeDimensions = mergeDimensions;
  var consumeLength = scope.consumeParenthesised.bind(null, parseLength);
  var consumeSizePair = scope.consumeRepeated.bind(void 0, consumeLength, /^/);
  var consumeSizePairList = scope.consumeRepeated.bind(void 0, consumeSizePair, /^,/);
  scope.consumeSizePairList = consumeSizePairList;
  var parseSizePairList = function(input) {
    var result = consumeSizePairList(input);
    if (result && "" == result[1]) {
      return result[0];
    }
  };
  var mergeNonNegativeSizePair = scope.mergeNestedRepeated.bind(void 0, mergeDimensionsNonNegative, " ");
  var mergeNonNegativeSizePairList = scope.mergeNestedRepeated.bind(void 0, mergeNonNegativeSizePair, ",");
  scope.mergeNonNegativeSizePair = mergeNonNegativeSizePair;
  scope.addPropertiesHandler(parseSizePairList, mergeNonNegativeSizePairList, [ "background-size" ]);
  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensionsNonNegative, [ "border-bottom-width", "border-image-width", "border-left-width", "border-right-width", "border-top-width", "flex-basis", "font-size", "height", "line-height", "max-height", "max-width", "outline-width", "width" ]);
  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensions, [ "border-bottom-left-radius", "border-bottom-right-radius", "border-top-left-radius", "border-top-right-radius", "bottom", "left", "letter-spacing", "margin-bottom", "margin-left", "margin-right", "margin-top", "min-height", "min-width", "outline-offset", "padding-bottom", "padding-left", "padding-right", "padding-top", "perspective", "right", "shape-margin", "text-indent", "top", "vertical-align", "word-spacing" ]);
})(webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  function consumeLengthPercentOrAuto(string) {
    return scope.consumeLengthOrPercent(string) || scope.consumeToken(/^auto/, string);
  }
  function parseBox(string) {
    var result = scope.consumeList([ scope.ignore(scope.consumeToken.bind(null, /^rect/)), scope.ignore(scope.consumeToken.bind(null, /^\(/)), scope.consumeRepeated.bind(null, consumeLengthPercentOrAuto, /^,/), scope.ignore(scope.consumeToken.bind(null, /^\)/)) ], string);
    if (result && 4 == result[0].length) {
      return result[0];
    }
  }
  function mergeComponent(left, right) {
    if ("auto" == left || "auto" == right) {
      return [ true, false, function(t) {
        var result = t ? left : right;
        if ("auto" == result) {
          return "auto";
        }
        var merged = scope.mergeDimensions(result, result);
        return merged[2](merged[0]);
      } ];
    }
    return scope.mergeDimensions(left, right);
  }
  function wrap(result) {
    return "rect(" + result + ")";
  }
  var mergeBoxes = scope.mergeWrappedNestedRepeated.bind(null, wrap, mergeComponent, ", ");
  scope.parseBox = parseBox;
  scope.mergeBoxes = mergeBoxes;
  scope.addPropertiesHandler(parseBox, mergeBoxes, [ "clip" ]);
})(webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  var _ = null;
  function cast(pattern) {
    return function(contents) {
      var i = 0;
      return pattern.map(function(x) {
        return x === _ ? contents[i++] : x;
      });
    };
  }
  function id(x) {
    return x;
  }
  var Opx = {
    px: 0
  };
  var Odeg = {
    deg: 0
  };
  var transformFunctions = {
    matrix: [ "NNNNNN", [ _, _, 0, 0, _, _, 0, 0, 0, 0, 1, 0, _, _, 0, 1 ], id ],
    matrix3d: [ "NNNNNNNNNNNNNNNN", id ],
    rotate: [ "A" ],
    rotatex: [ "A" ],
    rotatey: [ "A" ],
    rotatez: [ "A" ],
    rotate3d: [ "NNNA" ],
    perspective: [ "L" ],
    scale: [ "Nn", cast([ _, _, 1 ]), id ],
    scalex: [ "N", cast([ _, 1, 1 ]), cast([ _, 1 ]) ],
    scaley: [ "N", cast([ 1, _, 1 ]), cast([ 1, _ ]) ],
    scalez: [ "N", cast([ 1, 1, _ ]) ],
    scale3d: [ "NNN", id ],
    skew: [ "Aa", null, id ],
    skewx: [ "A", null, cast([ _, Odeg ]) ],
    skewy: [ "A", null, cast([ Odeg, _ ]) ],
    translate: [ "Tt", cast([ _, _, Opx ]), id ],
    translatex: [ "T", cast([ _, Opx, Opx ]), cast([ _, Opx ]) ],
    translatey: [ "T", cast([ Opx, _, Opx ]), cast([ Opx, _ ]) ],
    translatez: [ "L", cast([ Opx, Opx, _ ]) ],
    translate3d: [ "TTL", id ]
  };
  function parseTransform(string) {
    string = string.toLowerCase().trim();
    if ("none" == string) {
      return [];
    }
    var transformRegExp = /\s*(\w+)\(([^)]*)\)/g;
    var result = [];
    var match;
    var prevLastIndex = 0;
    while (match = transformRegExp.exec(string)) {
      if (match.index != prevLastIndex) {
        return;
      }
      prevLastIndex = match.index + match[0].length;
      var functionName = match[1];
      var functionData = transformFunctions[functionName];
      if (!functionData) {
        return;
      }
      var args = match[2].split(",");
      var argTypes = functionData[0];
      if (argTypes.length < args.length) {
        return;
      }
      var parsedArgs = [];
      for (var i = 0; i < argTypes.length; i++) {
        var arg = args[i];
        var type = argTypes[i];
        var parsedArg;
        if (!arg) {
          parsedArg = {
            a: Odeg,
            n: parsedArgs[0],
            t: Opx
          }[type];
        } else {
          parsedArg = {
            A: function(s) {
              return "0" == s.trim() ? Odeg : scope.parseAngle(s);
            },
            N: scope.parseNumber,
            T: scope.parseLengthOrPercent,
            L: scope.parseLength
          }[type.toUpperCase()](arg);
        }
        if (void 0 === parsedArg) {
          return;
        }
        parsedArgs.push(parsedArg);
      }
      result.push({
        t: functionName,
        d: parsedArgs
      });
      if (transformRegExp.lastIndex == string.length) {
        return result;
      }
    }
  }
  function numberToLongString(x) {
    return x.toFixed(6).replace(".000000", "");
  }
  function mergeMatrices(left, right) {
    if (left.decompositionPair !== right) {
      left.decompositionPair = right;
      var leftArgs = scope.makeMatrixDecomposition(left);
    }
    if (right.decompositionPair !== left) {
      right.decompositionPair = left;
      var rightArgs = scope.makeMatrixDecomposition(right);
    }
    if (null == leftArgs[0] || null == rightArgs[0]) {
      return [ [ false ], [ true ], function(x) {
        return x ? right[0].d : left[0].d;
      } ];
    }
    leftArgs[0].push(0);
    rightArgs[0].push(1);
    return [ leftArgs, rightArgs, function(list) {
      var quat = scope.quat(leftArgs[0][3], rightArgs[0][3], list[5]);
      var mat = scope.composeMatrix(list[0], list[1], list[2], quat, list[4]);
      var stringifiedArgs = mat.map(numberToLongString).join(",");
      return stringifiedArgs;
    } ];
  }
  function typeTo2D(type) {
    return type.replace(/[xy]/, "");
  }
  function typeTo3D(type) {
    return type.replace(/(x|y|z|3d)?$/, "3d");
  }
  function mergeTransforms(left, right) {
    var matrixModulesLoaded = scope.makeMatrixDecomposition && true;
    var flipResults = false;
    if (!left.length || !right.length) {
      if (!left.length) {
        flipResults = true;
        left = right;
        right = [];
      }
      for (var i = 0; i < left.length; i++) {
        var type = left[i].t;
        var args = left[i].d;
        var defaultValue = "scale" == type.substr(0, 5) ? 1 : 0;
        right.push({
          t: type,
          d: args.map(function(arg) {
            if ("number" == typeof arg) {
              return defaultValue;
            }
            var result = {};
            for (var unit in arg) {
              result[unit] = defaultValue;
            }
            return result;
          })
        });
      }
    }
    var isMatrixOrPerspective = function(lt, rt) {
      return "perspective" == lt && "perspective" == rt || ("matrix" == lt || "matrix3d" == lt) && ("matrix" == rt || "matrix3d" == rt);
    };
    var leftResult = [];
    var rightResult = [];
    var types = [];
    if (left.length != right.length) {
      if (!matrixModulesLoaded) {
        return;
      }
      var merged = mergeMatrices(left, right);
      leftResult = [ merged[0] ];
      rightResult = [ merged[1] ];
      types = [ [ "matrix", [ merged[2] ] ] ];
    } else {
      for (var i = 0; i < left.length; i++) {
        var leftType = left[i].t;
        var rightType = right[i].t;
        var leftArgs = left[i].d;
        var rightArgs = right[i].d;
        var leftFunctionData = transformFunctions[leftType];
        var rightFunctionData = transformFunctions[rightType];
        var type;
        if (isMatrixOrPerspective(leftType, rightType)) {
          if (!matrixModulesLoaded) {
            return;
          }
          var merged = mergeMatrices([ left[i] ], [ right[i] ]);
          leftResult.push(merged[0]);
          rightResult.push(merged[1]);
          types.push([ "matrix", [ merged[2] ] ]);
          continue;
        } else {
          if (leftType == rightType) {
            type = leftType;
          } else {
            if (leftFunctionData[2] && rightFunctionData[2] && typeTo2D(leftType) == typeTo2D(rightType)) {
              type = typeTo2D(leftType);
              leftArgs = leftFunctionData[2](leftArgs);
              rightArgs = rightFunctionData[2](rightArgs);
            } else {
              if (leftFunctionData[1] && rightFunctionData[1] && typeTo3D(leftType) == typeTo3D(rightType)) {
                type = typeTo3D(leftType);
                leftArgs = leftFunctionData[1](leftArgs);
                rightArgs = rightFunctionData[1](rightArgs);
              } else {
                if (!matrixModulesLoaded) {
                  return;
                }
                var merged = mergeMatrices(left, right);
                leftResult = [ merged[0] ];
                rightResult = [ merged[1] ];
                types = [ [ "matrix", [ merged[2] ] ] ];
                break;
              }
            }
          }
        }
        var leftArgsCopy = [];
        var rightArgsCopy = [];
        var stringConversions = [];
        for (var j = 0; j < leftArgs.length; j++) {
          var merge = "number" == typeof leftArgs[j] ? scope.mergeNumbers : scope.mergeDimensions;
          var merged = merge(leftArgs[j], rightArgs[j]);
          leftArgsCopy[j] = merged[0];
          rightArgsCopy[j] = merged[1];
          stringConversions.push(merged[2]);
        }
        leftResult.push(leftArgsCopy);
        rightResult.push(rightArgsCopy);
        types.push([ type, stringConversions ]);
      }
    }
    if (flipResults) {
      var tmp = leftResult;
      leftResult = rightResult;
      rightResult = tmp;
    }
    return [ leftResult, rightResult, function(list) {
      return list.map(function(args, i) {
        var stringifiedArgs = args.map(function(arg, j) {
          return types[i][1][j](arg);
        }).join(",");
        if ("matrix" == types[i][0] && 16 == stringifiedArgs.split(",").length) {
          types[i][0] = "matrix3d";
        }
        return types[i][0] + "(" + stringifiedArgs + ")";
      }).join(" ");
    } ];
  }
  scope.addPropertiesHandler(parseTransform, mergeTransforms, [ "transform" ]);
  if (false) {
    testing.parseTransform = parseTransform;
  }
})(webAnimations1, webAnimationsTesting);

(function(scope, testing) {
  var aliased = {};
  function alias(name, aliases) {
    aliases.concat([ name ]).forEach(function(candidate) {
      if (candidate in document.documentElement.style) {
        aliased[name] = candidate;
      }
    });
  }
  alias("transform", [ "webkitTransform", "msTransform" ]);
  alias("transformOrigin", [ "webkitTransformOrigin" ]);
  alias("perspective", [ "webkitPerspective" ]);
  alias("perspectiveOrigin", [ "webkitPerspectiveOrigin" ]);
  scope.propertyName = function(property) {
    return aliased[property] || property;
  };
})(webAnimations1, webAnimationsTesting);})();
//# sourceMappingURL=inter-guarded-web-animations-next-lite-web-animations-1.js.map
(function(shared, scope, testing) {
  var originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f) {
    return originalRequestAnimationFrame(function(x) {
      window.document.timeline._updateAnimationsPromises();
      f(x);
      window.document.timeline._updateAnimationsPromises();
    });
  };
  scope.AnimationTimeline = function() {
    this._animations = [];
    this.currentTime = void 0;
  };
  scope.AnimationTimeline.prototype = {
    getAnimations: function() {
      this._discardAnimations();
      return this._animations.slice();
    },
    _updateAnimationsPromises: function() {
      scope.animationsWithPromises = scope.animationsWithPromises.filter(function(animation) {
        return animation._updatePromises();
      });
    },
    _discardAnimations: function() {
      this._updateAnimationsPromises();
      this._animations = this._animations.filter(function(animation) {
        return "finished" != animation.playState && "idle" != animation.playState;
      });
    },
    _play: function(effect) {
      var animation = new scope.Animation(effect, this);
      this._animations.push(animation);
      scope.restartWebAnimationsNextTick();
      animation._updatePromises();
      animation._animation.play();
      animation._updatePromises();
      return animation;
    },
    play: function(effect) {
      if (effect) {
        effect.remove();
      }
      return this._play(effect);
    }
  };
  var ticking = false;
  scope.restartWebAnimationsNextTick = function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(webAnimationsNextTick);
    }
  };
  function webAnimationsNextTick(t) {
    var timeline = window.document.timeline;
    timeline.currentTime = t;
    timeline._discardAnimations();
    if (0 == timeline._animations.length) {
      ticking = false;
    } else {
      requestAnimationFrame(webAnimationsNextTick);
    }
  }
  var timeline = new scope.AnimationTimeline();
  scope.timeline = timeline;
  try {
    Object.defineProperty(window.document, "timeline", {
      configurable: true,
      get: function() {
        return timeline;
      }
    });
  } catch (e) {}
  try {
    window.document.timeline = timeline;
  } catch (e) {}
})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);

(function(shared, scope, testing) {
  scope.animationsWithPromises = [];
  scope.Animation = function(effect, timeline) {
    this.effect = effect;
    if (effect) {
      effect._animation = this;
    }
    if (!timeline) {
      throw new Error("Animation with null timeline is not supported");
    }
    this._timeline = timeline;
    this._sequenceNumber = shared.sequenceNumber++;
    this._holdTime = 0;
    this._paused = false;
    this._isGroup = false;
    this._animation = null;
    this._childAnimations = [];
    this._callback = null;
    this._oldPlayState = "idle";
    this._rebuildUnderlyingAnimation();
    this._animation.cancel();
    this._updatePromises();
  };
  scope.Animation.prototype = {
    _updatePromises: function() {
      var oldPlayState = this._oldPlayState;
      var newPlayState = this.playState;
      if (this._readyPromise && newPlayState !== oldPlayState) {
        if ("idle" == newPlayState) {
          this._rejectReadyPromise();
          this._readyPromise = void 0;
        } else {
          if ("pending" == oldPlayState) {
            this._resolveReadyPromise();
          } else {
            if ("pending" == newPlayState) {
              this._readyPromise = void 0;
            }
          }
        }
      }
      if (this._finishedPromise && newPlayState !== oldPlayState) {
        if ("idle" == newPlayState) {
          this._rejectFinishedPromise();
          this._finishedPromise = void 0;
        } else {
          if ("finished" == newPlayState) {
            this._resolveFinishedPromise();
          } else {
            if ("finished" == oldPlayState) {
              this._finishedPromise = void 0;
            }
          }
        }
      }
      this._oldPlayState = this.playState;
      return this._readyPromise || this._finishedPromise;
    },
    _rebuildUnderlyingAnimation: function() {
      this._updatePromises();
      var oldPlaybackRate;
      var oldPaused;
      var oldStartTime;
      var oldCurrentTime;
      var hadUnderlying = this._animation ? true : false;
      if (hadUnderlying) {
        oldPlaybackRate = this.playbackRate;
        oldPaused = this._paused;
        oldStartTime = this.startTime;
        oldCurrentTime = this.currentTime;
        this._animation.cancel();
        this._animation._wrapper = null;
        this._animation = null;
      }
      if (!this.effect || this.effect instanceof window.KeyframeEffect) {
        this._animation = scope.newUnderlyingAnimationForKeyframeEffect(this.effect);
        scope.bindAnimationForKeyframeEffect(this);
      }
      if (this.effect instanceof window.SequenceEffect || this.effect instanceof window.GroupEffect) {
        this._animation = scope.newUnderlyingAnimationForGroup(this.effect);
        scope.bindAnimationForGroup(this);
      }
      if (this.effect && this.effect._onsample) {
        scope.bindAnimationForCustomEffect(this);
      }
      if (hadUnderlying) {
        if (1 != oldPlaybackRate) {
          this.playbackRate = oldPlaybackRate;
        }
        if (null !== oldStartTime) {
          this.startTime = oldStartTime;
        } else {
          if (null !== oldCurrentTime) {
            this.currentTime = oldCurrentTime;
          } else {
            if (null !== this._holdTime) {
              this.currentTime = this._holdTime;
            }
          }
        }
        if (oldPaused) {
          this.pause();
        }
      }
      this._updatePromises();
    },
    _updateChildren: function() {
      if (!this.effect || "idle" == this.playState) {
        return;
      }
      var offset = this.effect._timing.delay;
      this._childAnimations.forEach(function(childAnimation) {
        this._arrangeChildren(childAnimation, offset);
        if (this.effect instanceof window.SequenceEffect) {
          offset += scope.groupChildDuration(childAnimation.effect);
        }
      }.bind(this));
    },
    _setExternalAnimation: function(animation) {
      if (!this.effect || !this._isGroup) {
        return;
      }
      for (var i = 0; i < this.effect.children.length; i++) {
        this.effect.children[i]._animation = animation;
        this._childAnimations[i]._setExternalAnimation(animation);
      }
    },
    _constructChildAnimations: function() {
      if (!this.effect || !this._isGroup) {
        return;
      }
      var offset = this.effect._timing.delay;
      this._removeChildAnimations();
      this.effect.children.forEach(function(child) {
        var childAnimation = window.document.timeline._play(child);
        this._childAnimations.push(childAnimation);
        childAnimation.playbackRate = this.playbackRate;
        if (this._paused) {
          childAnimation.pause();
        }
        child._animation = this.effect._animation;
        this._arrangeChildren(childAnimation, offset);
        if (this.effect instanceof window.SequenceEffect) {
          offset += scope.groupChildDuration(child);
        }
      }.bind(this));
    },
    _arrangeChildren: function(childAnimation, offset) {
      if (null === this.startTime) {
        childAnimation.currentTime = this.currentTime - offset / this.playbackRate;
      } else {
        if (childAnimation.startTime !== this.startTime + offset / this.playbackRate) {
          childAnimation.startTime = this.startTime + offset / this.playbackRate;
        }
      }
    },
    get timeline() {
      return this._timeline;
    },
    get playState() {
      return this._animation ? this._animation.playState : "idle";
    },
    get finished() {
      if (!window.Promise) {
        console.warn("Animation Promises require JavaScript Promise constructor");
        return null;
      }
      if (!this._finishedPromise) {
        if (scope.animationsWithPromises.indexOf(this) == -1) {
          scope.animationsWithPromises.push(this);
        }
        this._finishedPromise = new Promise(function(resolve, reject) {
          this._resolveFinishedPromise = function() {
            resolve(this);
          };
          this._rejectFinishedPromise = function() {
            reject({
              type: DOMException.ABORT_ERR,
              name: "AbortError"
            });
          };
        }.bind(this));
        if ("finished" == this.playState) {
          this._resolveFinishedPromise();
        }
      }
      return this._finishedPromise;
    },
    get ready() {
      if (!window.Promise) {
        console.warn("Animation Promises require JavaScript Promise constructor");
        return null;
      }
      if (!this._readyPromise) {
        if (scope.animationsWithPromises.indexOf(this) == -1) {
          scope.animationsWithPromises.push(this);
        }
        this._readyPromise = new Promise(function(resolve, reject) {
          this._resolveReadyPromise = function() {
            resolve(this);
          };
          this._rejectReadyPromise = function() {
            reject({
              type: DOMException.ABORT_ERR,
              name: "AbortError"
            });
          };
        }.bind(this));
        if ("pending" !== this.playState) {
          this._resolveReadyPromise();
        }
      }
      return this._readyPromise;
    },
    get onfinish() {
      return this._onfinish;
    },
    set onfinish(v) {
      if ("function" == typeof v) {
        this._onfinish = v;
        this._animation.onfinish = function(e) {
          e.target = this;
          v.call(this, e);
        }.bind(this);
      } else {
        this._animation.onfinish = v;
        this.onfinish = this._animation.onfinish;
      }
    },
    get currentTime() {
      this._updatePromises();
      var currentTime = this._animation.currentTime;
      this._updatePromises();
      return currentTime;
    },
    set currentTime(v) {
      this._updatePromises();
      this._animation.currentTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.currentTime = v - offset;
      });
      this._updatePromises();
    },
    get startTime() {
      return this._animation.startTime;
    },
    set startTime(v) {
      this._updatePromises();
      this._animation.startTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.startTime = v + offset;
      });
      this._updatePromises();
    },
    get playbackRate() {
      return this._animation.playbackRate;
    },
    set playbackRate(value) {
      this._updatePromises();
      var oldCurrentTime = this.currentTime;
      this._animation.playbackRate = value;
      this._forEachChild(function(childAnimation) {
        childAnimation.playbackRate = value;
      });
      if ("paused" != this.playState && "idle" != this.playState) {
        this.play();
      }
      if (null !== oldCurrentTime) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    play: function() {
      this._updatePromises();
      this._paused = false;
      this._animation.play();
      if (this._timeline._animations.indexOf(this) == -1) {
        this._timeline._animations.push(this);
      }
      this._register();
      scope.awaitStartTime(this);
      this._forEachChild(function(child) {
        var time = child.currentTime;
        child.play();
        child.currentTime = time;
      });
      this._updatePromises();
    },
    pause: function() {
      this._updatePromises();
      if (this.currentTime) {
        this._holdTime = this.currentTime;
      }
      this._animation.pause();
      this._register();
      this._forEachChild(function(child) {
        child.pause();
      });
      this._paused = true;
      this._updatePromises();
    },
    finish: function() {
      this._updatePromises();
      this._animation.finish();
      this._register();
      this._updatePromises();
    },
    cancel: function() {
      this._updatePromises();
      this._animation.cancel();
      this._register();
      this._removeChildAnimations();
      this._updatePromises();
    },
    reverse: function() {
      this._updatePromises();
      var oldCurrentTime = this.currentTime;
      this._animation.reverse();
      this._forEachChild(function(childAnimation) {
        childAnimation.reverse();
      });
      if (null !== oldCurrentTime) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    addEventListener: function(type, handler) {
      var wrapped = handler;
      if ("function" == typeof handler) {
        wrapped = function(e) {
          e.target = this;
          handler.call(this, e);
        }.bind(this);
        handler._wrapper = wrapped;
      }
      this._animation.addEventListener(type, wrapped);
    },
    removeEventListener: function(type, handler) {
      this._animation.removeEventListener(type, handler && handler._wrapper || handler);
    },
    _removeChildAnimations: function() {
      while (this._childAnimations.length) {
        this._childAnimations.pop().cancel();
      }
    },
    _forEachChild: function(f) {
      var offset = 0;
      if (this.effect.children && this._childAnimations.length < this.effect.children.length) {
        this._constructChildAnimations();
      }
      this._childAnimations.forEach(function(child) {
        f.call(this, child, offset);
        if (this.effect instanceof window.SequenceEffect) {
          offset += child.effect.activeDuration;
        }
      }.bind(this));
      if ("pending" == this.playState) {
        return;
      }
      var timing = this.effect._timing;
      var t = this.currentTime;
      if (null !== t) {
        t = shared.calculateTimeFraction(shared.calculateActiveDuration(timing), t, timing);
      }
      if (null == t || isNaN(t)) {
        this._removeChildAnimations();
      }
    }
  };
  window.Animation = scope.Animation;
  if (false) {
    testing.webAnimationsNextAnimation = scope.Animation;
  }
})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);

(function(shared, scope, testing) {
  var disassociate = function(effect) {
    effect._animation = void 0;
    if (effect instanceof window.SequenceEffect || effect instanceof window.GroupEffect) {
      for (var i = 0; i < effect.children.length; i++) {
        disassociate(effect.children[i]);
      }
    }
  };
  scope.removeMulti = function(effects) {
    var oldParents = [];
    for (var i = 0; i < effects.length; i++) {
      var effect = effects[i];
      if (effect._parent) {
        if (oldParents.indexOf(effect._parent) == -1) {
          oldParents.push(effect._parent);
        }
        effect._parent.children.splice(effect._parent.children.indexOf(effect), 1);
        effect._parent = null;
        disassociate(effect);
      } else {
        if (effect._animation && effect._animation.effect == effect) {
          effect._animation.cancel();
          effect._animation.effect = new KeyframeEffect(null, []);
          if (effect._animation._callback) {
            effect._animation._callback._animation = null;
          }
          effect._animation._rebuildUnderlyingAnimation();
          disassociate(effect);
        }
      }
    }
    for (i = 0; i < oldParents.length; i++) {
      oldParents[i]._rebuild();
    }
  };
  function KeyframeList(effectInput) {
    this._frames = shared.normalizeKeyframes(effectInput);
  }
  scope.KeyframeEffect = function(target, effectInput, timingInput) {
    this.target = target;
    this._parent = null;
    timingInput = shared.numericTimingToObject(timingInput);
    this._timingInput = shared.cloneTimingInput(timingInput);
    this._timing = shared.normalizeTimingInput(timingInput);
    this.timing = shared.makeTiming(timingInput, false, this);
    this.timing._effect = this;
    if ("function" == typeof effectInput) {
      shared.deprecated("Custom KeyframeEffect", "2015-06-22", "Use KeyframeEffect.onsample instead.");
      this._normalizedKeyframes = effectInput;
    } else {
      this._normalizedKeyframes = new KeyframeList(effectInput);
    }
    this._keyframes = effectInput;
    this.activeDuration = shared.calculateActiveDuration(this._timing);
    return this;
  };
  scope.KeyframeEffect.prototype = {
    getFrames: function() {
      if ("function" == typeof this._normalizedKeyframes) {
        return this._normalizedKeyframes;
      }
      return this._normalizedKeyframes._frames;
    },
    set onsample(callback) {
      if ("function" == typeof this.getFrames()) {
        throw new Error("Setting onsample on custom effect KeyframeEffect is not supported.");
      }
      this._onsample = callback;
      if (this._animation) {
        this._animation._rebuildUnderlyingAnimation();
      }
    },
    get parent() {
      return this._parent;
    },
    clone: function() {
      if ("function" == typeof this.getFrames()) {
        throw new Error("Cloning custom effects is not supported.");
      }
      var clone = new KeyframeEffect(this.target, [], shared.cloneTimingInput(this._timingInput));
      clone._normalizedKeyframes = this._normalizedKeyframes;
      clone._keyframes = this._keyframes;
      return clone;
    },
    remove: function() {
      scope.removeMulti([ this ]);
    }
  };
  var originalElementAnimate = Element.prototype.animate;
  Element.prototype.animate = function(effectInput, timing) {
    return scope.timeline._play(new scope.KeyframeEffect(this, effectInput, timing));
  };
  var nullTarget = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
  scope.newUnderlyingAnimationForKeyframeEffect = function(keyframeEffect) {
    if (keyframeEffect) {
      var target = keyframeEffect.target || nullTarget;
      var keyframes = keyframeEffect._keyframes;
      if ("function" == typeof keyframes) {
        keyframes = [];
      }
      var timing = keyframeEffect._timingInput;
    } else {
      var target = nullTarget;
      var keyframes = [];
      var timing = 0;
    }
    return originalElementAnimate.apply(target, [ keyframes, timing ]);
  };
  scope.bindAnimationForKeyframeEffect = function(animation) {
    if (animation.effect && "function" == typeof animation.effect._normalizedKeyframes) {
      scope.bindAnimationForCustomEffect(animation);
    }
  };
  var pendingGroups = [];
  scope.awaitStartTime = function(groupAnimation) {
    if (null !== groupAnimation.startTime || !groupAnimation._isGroup) {
      return;
    }
    if (0 == pendingGroups.length) {
      requestAnimationFrame(updatePendingGroups);
    }
    pendingGroups.push(groupAnimation);
  };
  function updatePendingGroups() {
    var updated = false;
    while (pendingGroups.length) {
      var group = pendingGroups.shift();
      group._updateChildren();
      updated = true;
    }
    return updated;
  }
  var originalGetComputedStyle = window.getComputedStyle;
  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    enumerable: true,
    value: function() {
      window.document.timeline._updateAnimationsPromises();
      var result = originalGetComputedStyle.apply(this, arguments);
      if (updatePendingGroups()) {
        result = originalGetComputedStyle.apply(this, arguments);
      }
      window.document.timeline._updateAnimationsPromises();
      return result;
    }
  });
  window.KeyframeEffect = scope.KeyframeEffect;
  window.Element.prototype.getAnimations = function() {
    return document.timeline.getAnimations().filter(function(animation) {
      return null !== animation.effect && animation.effect.target == this;
    }.bind(this));
  };
})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);

(function(shared, scope, testing) {
  var nullTarget = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
  var sequenceNumber = 0;
  scope.bindAnimationForCustomEffect = function(animation) {
    var target = animation.effect.target;
    var effectFunction;
    var isKeyframeEffect = "function" == typeof animation.effect.getFrames();
    if (isKeyframeEffect) {
      effectFunction = animation.effect.getFrames();
    } else {
      effectFunction = animation.effect._onsample;
    }
    var timing = animation.effect.timing;
    var last = null;
    timing = shared.normalizeTimingInput(timing);
    var callback = function() {
      var t = callback._animation ? callback._animation.currentTime : null;
      if (null !== t) {
        t = shared.calculateTimeFraction(shared.calculateActiveDuration(timing), t, timing);
        if (isNaN(t)) {
          t = null;
        }
      }
      if (t !== last) {
        if (isKeyframeEffect) {
          effectFunction(t, target, animation.effect);
        } else {
          effectFunction(t, animation.effect, animation.effect._animation);
        }
      }
      last = t;
    };
    callback._animation = animation;
    callback._registered = false;
    callback._sequenceNumber = sequenceNumber++;
    animation._callback = callback;
    register(callback);
  };
  var callbacks = [];
  var ticking = false;
  function register(callback) {
    if (callback._registered) {
      return;
    }
    callback._registered = true;
    callbacks.push(callback);
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }
  function tick(t) {
    var updating = callbacks;
    callbacks = [];
    updating.sort(function(left, right) {
      return left._sequenceNumber - right._sequenceNumber;
    });
    updating = updating.filter(function(callback) {
      callback();
      var playState = callback._animation ? callback._animation.playState : "idle";
      if ("running" != playState && "pending" != playState) {
        callback._registered = false;
      }
      return callback._registered;
    });
    callbacks.push.apply(callbacks, updating);
    if (callbacks.length) {
      ticking = true;
      requestAnimationFrame(tick);
    } else {
      ticking = false;
    }
  }
  scope.Animation.prototype._register = function() {
    if (this._callback) {
      register(this._callback);
    }
  };
})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);

(function(shared, scope, testing) {
  function groupChildDuration(node) {
    return node._timing.delay + node.activeDuration + node._timing.endDelay;
  }
  function constructor(children, timingInput) {
    this._parent = null;
    this.children = children || [];
    this._reparent(this.children);
    timingInput = shared.numericTimingToObject(timingInput);
    this._timingInput = shared.cloneTimingInput(timingInput);
    this._timing = shared.normalizeTimingInput(timingInput, true);
    this.timing = shared.makeTiming(timingInput, true, this);
    this.timing._effect = this;
    if ("auto" === this._timing.duration) {
      this._timing.duration = this.activeDuration;
    }
  }
  window.SequenceEffect = function() {
    constructor.apply(this, arguments);
  };
  window.GroupEffect = function() {
    constructor.apply(this, arguments);
  };
  constructor.prototype = {
    _isAncestor: function(effect) {
      var a = this;
      while (null !== a) {
        if (a == effect) {
          return true;
        }
        a = a._parent;
      }
      return false;
    },
    _rebuild: function() {
      var node = this;
      while (node) {
        if ("auto" === node.timing.duration) {
          node._timing.duration = node.activeDuration;
        }
        node = node._parent;
      }
      if (this._animation) {
        this._animation._rebuildUnderlyingAnimation();
      }
    },
    _reparent: function(newChildren) {
      scope.removeMulti(newChildren);
      for (var i = 0; i < newChildren.length; i++) {
        newChildren[i]._parent = this;
      }
    },
    _putChild: function(args, isAppend) {
      var message = isAppend ? "Cannot append an ancestor or self" : "Cannot prepend an ancestor or self";
      for (var i = 0; i < args.length; i++) {
        if (this._isAncestor(args[i])) {
          throw {
            type: DOMException.HIERARCHY_REQUEST_ERR,
            name: "HierarchyRequestError",
            message: message
          };
        }
      }
      var oldParents = [];
      for (var i = 0; i < args.length; i++) {
        isAppend ? this.children.push(args[i]) : this.children.unshift(args[i]);
      }
      this._reparent(args);
      this._rebuild();
    },
    append: function() {
      this._putChild(arguments, true);
    },
    prepend: function() {
      this._putChild(arguments, false);
    },
    get parent() {
      return this._parent;
    },
    get firstChild() {
      return this.children.length ? this.children[0] : null;
    },
    get lastChild() {
      return this.children.length ? this.children[this.children.length - 1] : null;
    },
    clone: function() {
      var clonedTiming = shared.cloneTimingInput(this._timingInput);
      var clonedChildren = [];
      for (var i = 0; i < this.children.length; i++) {
        clonedChildren.push(this.children[i].clone());
      }
      return this instanceof GroupEffect ? new GroupEffect(clonedChildren, clonedTiming) : new SequenceEffect(clonedChildren, clonedTiming);
    },
    remove: function() {
      scope.removeMulti([ this ]);
    }
  };
  window.SequenceEffect.prototype = Object.create(constructor.prototype);
  Object.defineProperty(window.SequenceEffect.prototype, "activeDuration", {
    get: function() {
      var total = 0;
      this.children.forEach(function(child) {
        total += groupChildDuration(child);
      });
      return Math.max(total, 0);
    }
  });
  window.GroupEffect.prototype = Object.create(constructor.prototype);
  Object.defineProperty(window.GroupEffect.prototype, "activeDuration", {
    get: function() {
      var max = 0;
      this.children.forEach(function(child) {
        max = Math.max(max, groupChildDuration(child));
      });
      return max;
    }
  });
  scope.newUnderlyingAnimationForGroup = function(group) {
    var underlyingAnimation;
    var timing = null;
    var ticker = function(tf) {
      var animation = underlyingAnimation._wrapper;
      if (!animation) {
        return;
      }
      if ("pending" == animation.playState) {
        return;
      }
      if (!animation.effect) {
        return;
      }
      if (null == tf) {
        animation._removeChildAnimations();
        return;
      }
      if (0 == tf && animation.playbackRate < 0) {
        if (!timing) {
          timing = shared.normalizeTimingInput(animation.effect.timing);
        }
        tf = shared.calculateTimeFraction(shared.calculateActiveDuration(timing), -1, timing);
        if (isNaN(tf) || null == tf) {
          animation._forEachChild(function(child) {
            child.currentTime = -1;
          });
          animation._removeChildAnimations();
          return;
        }
      }
    };
    var underlyingEffect = new KeyframeEffect(null, [], group._timing);
    underlyingEffect.onsample = ticker;
    underlyingAnimation = scope.timeline._play(underlyingEffect);
    return underlyingAnimation;
  };
  scope.bindAnimationForGroup = function(animation) {
    animation._animation._wrapper = animation;
    animation._isGroup = true;
    scope.awaitStartTime(animation);
    animation._constructChildAnimations();
    animation._setExternalAnimation(animation);
  };
  scope.groupChildDuration = groupChildDuration;
})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
//# sourceMappingURL=inter-component-web-animations-next-lite.js.map
