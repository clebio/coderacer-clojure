// Generated by CoffeeScript 1.3.3
(function() {
  var codeJoin, codeSplit, entify, entityMap, j, preEscape, unentify, wrapCode;

  j = function(s) {
    return JSON.stringify(s);
  };

  codeSplit = function(code) {
    var char, token, tokens, _i, _len;
    tokens = [];
    token = "";
    for (_i = 0, _len = code.length; _i < _len; _i++) {
      char = code[_i];
      if (char === " ") {
        token = token.concat(char);
        tokens.push(token);
        token = "";
      } else if (char === "\n") {
        token = token.concat(char);
        tokens.push(token);
        token = "";
      } else {
        token = token.concat(char);
      }
    }
    tokens.push(token);
    return tokens;
  };

  codeJoin = function(splitCode) {
    var output, token, _i, _len;
    output = "";
    for (_i = 0, _len = splitCode.length; _i < _len; _i++) {
      token = splitCode[_i];
      if (token[token.length - 1] !== "\n") {
        output += token + " ";
      } else {
        output += token;
      }
    }
    return output;
  };

  wrapCode = function(code) {
    var i, output, splitCode, token, _i, _len;
    splitCode = codeSplit(code);
    output = "";
    for (i = _i = 0, _len = splitCode.length; _i < _len; i = ++_i) {
      token = splitCode[i];
      output += ("<span id=\"token-" + i + "\">") + token + "</span>";
    }
    return output;
  };

  entityMap = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;"
  };

  entify = function(char) {
    return entityMap[char] || char;
  };

  unentify = function(s) {
    var k, v;
    for (k in entityMap) {
      v = entityMap[k];
      if (s === v) {
        return k;
      }
    }
    return s;
  };

  preEscape = function(preCode) {
    var char, output, _i, _len;
    output = "";
    for (_i = 0, _len = preCode.length; _i < _len; _i++) {
      char = preCode[_i];
      output += entify(char);
    }
    return output;
  };

  window.allWhiteSpace = function(s) {
    return $.trim(s).length === 0;
  };

  window.getProblems = function() {
    var arr, html;
    html = $.trim($.ajax({
      url: "http://localhost:8000/data/parsed/",
      dataType: "html",
      async: false
    }).responseText);
    console.log("html: " + html);
    arr = [];
    $(html).find("a").each(function(i, el) {
      return arr.push(el.text.slice(0, el.text.length - 1));
    });
    return arr;
  };

  window.race = function() {
    var currentToken, escapedSample, getProblems, handleInput, inputToken, lang, languages, problem, problems, sample, samples, setMatch, setMiss, tokens, updateCurrentCSS;
    getProblems = function() {};
    getProblems();
    samples = [];
    problems = ["Anonymous_recursion", "Anagrams", "Ackermann_function"];
    languages = ["c", "ruby", "clojure"];
    lang = $("#lang option:selected").val();
    problem = $("#problem option:selected").val();
    console.log("problem: " + problem);
    console.log("lang: " + lang);
    sample = "hello";
    console.log("sample: " + sample);
    sample = $.trim($.ajax({
      url: "http://localhost:8000/data/parsed/" + problem + "/" + lang,
      dataType: "text",
      async: false
    }).responseText);
    console.log("sample: " + sample);
    tokens = codeSplit(sample);
    escapedSample = preEscape(sample);
    $("#code-text").append("<pre><span id=\"code-style\">" + wrapCode(escapedSample) + "</span></pre>");
    inputToken = "";
    currentToken = 0;
    $("#token-" + currentToken).addClass("current");
    $("#token-" + currentToken).addClass("match");
    setMatch = function(currentToken) {
      $("#token-" + currentToken).addClass("match");
      return $("#token-" + currentToken).removeClass("miss");
    };
    setMiss = function(currentToken) {
      $("#token-" + currentToken).addClass("miss");
      return $("#token-" + currentToken).removeClass("match");
    };
    updateCurrentCSS = function(currentToken) {
      console.log("currentToken: " + tokens[currentToken]);
      if (allWhiteSpace(tokens[currentToken])) {
        $("#token-" + currentToken).addClass("whitespace");
      }
      $("#token-" + currentToken).addClass("current");
      $("#token-" + (currentToken - 1)).removeClass("current");
      $("#token-" + (currentToken - 1)).removeClass("match");
      return $("#token-" + (currentToken - 1)).removeClass("whitespace");
    };
    handleInput = function(e) {
      if (e.which === 8 && inputToken.length > 0) {
        inputToken = inputToken.slice(0, inputToken.length - 1);
      } else if (e.which === 9) {
        while (allWhiteSpace(tokens[currentToken])) {
          currentToken += 1;
          inputToken = "";
          updateCurrentCSS(currentToken);
          $("#textInput").val("");
        }
        e.preventDefault();
      } else if (e.which === 13) {
        inputToken = inputToken.concat("\n");
        e.preventDefault();
      } else if (e.type === "keypress") {
        inputToken = inputToken.concat(unentify(String.fromCharCode(e.which)));
      }
      if (tokens[currentToken].slice(0, inputToken.length) === inputToken) {
        if (inputToken.length === tokens[currentToken].length) {
          currentToken += 1;
          inputToken = "";
          updateCurrentCSS(currentToken);
          $("#textInput").val("");
          e.preventDefault();
        }
        setMatch(currentToken);
      } else {
        setMiss(currentToken);
      }
      if (debug) {
        $("#entered-word").text("entered: " + inputToken + "\n");
        return $("#target-word").text("target: " + tokens[currentToken] + "\n");
      }
    };
    $("#textInput").keypress(handleInput);
    $("#textInput").keydown(handleInput);
    if (debug) {
      $("body").append("=====<br /><pre>" + escape(codeJoin(tokens)) + "</pre>");
      return $("body").append("=====<br /><pre>" + preEscape(codeJoin(tokens)) + "</pre>");
    }
  };

}).call(this);
