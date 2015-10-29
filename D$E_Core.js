//==============================================================================
// Dragon Engine (D$E) Core
// D$E_Core.js
// Version 1.0.0
//==============================================================================
/*
 * Copyright 2015 Ramiro Rojo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *    http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*:
 * @plugindesc The core script used by all of the Dragon Engine plugins.
 *
 * @param Allow Plugin Commands
 * Determines if this plugin and it's extensions will allow plugin commands.
 * Default: yes
 * @default yes
 *
 * @param Plugin Command name
 * The name used as plugin command.
 * Default: D$E
 * @default D$E
 *
 * @help
 *
 *
 */
var Imported = Imported || {};

if (PluginManager.register) {
  PluginManager.register("D$E_Core", "1.0.0", {
    "email": "ramiro.rojo.cretta@gmail.com",
    "website": "http://binarychest.wordpress.com",
    "name": "Ramiro Rojo"
  }, "2015-10-26");
} else {
  Imported["D$E_Core"] = "1.0.0";
}

if (!window.MVC) {
  throw new Error("The plugin 'D$E_Core' require the 'MVCommons plugin' to work properly!");
}

if (!Object.keys(PluginManager.parameters("D$E_Core")).length) {
  throw new Error("You seem to have put to 'D$E_Core' a different name in your plugin folder, this won't work!");
}

var D$E = (function (oldD$E) {
  "use strict";
  var editorParams = PluginManager.parameters("D$E_Core");

  var $ = {};
  var params = {};
  var _pluginCommands = {};

  /**
   * Restores the previous value stored in the D$E variable.
   *
   * @return The current value of the dragon engine.
   */
  $.noConflict = function () {
    D$E = oldD$E;
    return $;
  };

  if (MVC && MVC.naturalBoolean) {
    // I just take it from MVCommons then
    $.naturalBoolean = MVC.naturalBoolean;
  } else {
    /**
     * Allows to match your string as any of this to true:
     * - true
     * - yes
     * - active
     * - enabled
     * - on
     * - y
     *
     * @param text The text to check.
     * @return true if the text matches any of that text, or false.
     * @note Value is case insensitive.
     */
    $.naturalBoolean = function (text) {
      if ( text.match(/(y(es)?)|true|on|active|enabled/gi) ) {
        return true;
      }
      return false;
    };
  }

  $.number = function (value, max, min) {
    var n = Number(n || 0);
    if (max !== null && n > max) {
      return max;
    }
    if (min !== null && n < min) {
      return min;
    }
    return n;
  }

  $.parseList = function (list, type, separator) {
    return list.split(separator).map(function (i) { return $.parseParamType(type, i) });
  }

  $.parseParamType = function (schema, value) {
    var s, t, v, result;
    if (typeof schema == 'string') {
      t = schema;
      s = {};
    } else {
      t = schema.type || null;
      s = schema;
    }
    v = s.before ? s.before(value): value;
    switch (t || 'string') {
    case 'bool': case 'boolean':
      result = $.naturalBoolean(value);
      break;
    case 'number': case 'nul':
      result = $.number(value, s.max || null, s.min || null);
      break;
    case 'list': case 'array': case 'arr': case 'ary':
      result = $.parseList(value, s.of || '', s.separator || s.sep || ',');
      break;
    case 'str': case 'string': default:
      result = value;
      break;
    }
    if (s.after) {
      return s.after(result);
    }
    return result;
  }

  $.parametersFromSchema = function (editorParameters, schema) {
    var result = {};
    for (var p in schema) {
      if (Object.hasOwnProperty(p)) {
        result[p] = $.parseParamType(schema[p], editorParameters[p] || '');
      }
    }
    return result;
  }

  /**
   * Adds an object that can handle commands for the Dragon Engine.
   * It will be called inside D$E Plugin command to avoid name collitions.
   * When the command is requested, this plugin will call the method
   * _handleCommand of the handler object.
   *
   * @param name The name of the command.
   * @param handlerObject The object than handles the event.
   *
   */
  $.addCommandHandle = function (name, handlerObject) {
    _pluginCommands[name] = handlerObject;
  };

  if (MVC && MVC.safeEval) {
    // Taking it from MVC.
    $.safeEval = MVC.safeEval;
  } else {
    /**
     * Evaluates a context with some safety measure to stop it from breaking all.
     *
     * @param text The text to evaluate.
     * @return The result of the expression or null if something fails.
     *
     */
    $.safeEval = function (text) {
      try {
        return eval(text);
      } catch(e) {
        console.error(e); // print the error as error anyway
        return null;
      }
    };
  }


  if (MVC && MVC.degToRad) {
    // Taking it from MVC.
    $.degToRad = MVC.degToRad;
  } else {
    /**
     * Converts degrees into radians.
     *
     * @param deg Degrees to convert
     * @return Radiants equivalent to those degrees.
     *
     */
    $.degToRad = function (deg) {
      return deg * Math.PI / 180;
    }
  }


  if (MVC && MVC.radToDeg) {
    $.radToDeg = MVC.radToDeg;
  } else {
    /**
     * Converts radians into degrees.
     *
     * @param rad Radians to convert
     * @return Degrees equivalent to those radians.
     *
     */
    $.radToDeg = function (rad) {
      return rad * 180 / Math.PI;
    }
  }

  $.ensureParameters = function (name) {
    if (!Object.keys(PluginManager.parameters(name)).length) {
      throw new Error("You seem to have put to the plugin '" + name + "' a different name in your plugin folder, this won't work!");
    }
  };

  function fireEventCommand(name, args) {
    if (_pluginCommands[name]) {
      _pluginCommands['name']._handleCommand.apply(this, args);
      return;
    }
    throw new Error("The Dragon Engine doesn't recognize the plugin command '" + name + "'!");
  }

  $.PARAMETERS = {};

  $.PARAMETERS['Core'] = params;

  params.allowPluginCommands = $.naturalBoolean(editorParams["Allow Plugin Commands"] || 'no');
  params.pluginCommandName = editorParams['Plugin Command name'] || 'D$E';

  if (params.allowPluginCommands) {
    $.addCommandHandle = addCommandHandle;
  } else {
    $.addCommandHandle = function () {};
  }

  // Adding plugin command handling
  var Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;

  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === params.pluginCommandName) {
      var subArgs = Array.prototype.slice.call(args, 1);
      fireEventCommand.call(this, args[0], subArgs);
    }
  };


  return $;

})(D$E || null);