// SEARCH
"use strict";
var searchFn = function () {
    var lastTerm = "You are likely to be eaten by a grue.";
    var stopwords = ["i", "me", "my", "we", "our", "you", "it",
        "its", "this", "that", "am", "is", "are", "was", "be",
        "has", "had", "do", "a", "an", "the", "but", "if", "or", "as",
        "of", "at", "by", "for", "with", "to", "then", "no", "not",
        "so", "too", "can", "and", "but"];
    var normalizer = document.createElement("textarea");
    var normalize = function (input) {
        normalizer.innerHTML = input;
        var inputDecoded = normalizer.value;
        return " " + inputDecoded.trim().toLowerCase().replace(/[^0-9a-z ]/gi, " ").replace(/\s+/g, " ") + " ";
    }
    var limit = 30;
    var minChars = 2;
    var searching = false;
    var render = function (results) {
        results.sort(function (a, b) { return b.weight - a.weight; });
        for (var i = 0; i < results.length && i < limit; i += 1) {
            var result = results[i].item;
            var openAnchor = "<a href=\"" + result.permalink + "\" " +
                "alt=\"" + result.showTitle + "\">";
            var resultPane = "<div class=\"container\">" +
                "<div class=\"row\">" +
                "<div class=\"col-12 markutreklam\">" +
                openAnchor + "<img src=\"" + result.image + "\" alt=\"" + result.showTitle + "\" class=\"rounded w-100\"></a></div>" +
                ("<div class=\"h2 title mt-3\" >"+  openAnchor + result.showTitle +"</a></div>" + "<small>" + result.showSummary + "</small></div>") +
                "</div>";
            $("#results").append(resultPane);
        }
    };
    var checkTerms = function (terms, weight, target) {
        var weightResult = 0;
        terms.forEach(function (term) {
            if (~target.indexOf(term.term)) {
                var idx = target.indexOf(term.term);
                while (~idx) {
                    weightResult += term.weight * weight;
                    idx = target.indexOf(term.term, idx + 1);
                }
            }
        });
        return weightResult;
    };
    var search = function (terms) {
        var results = [];
        searchHost.index.forEach(function (item) {
            if (item.tags) {
                var weight_1 = 0;
                terms.forEach(function (term) {
                    if (item.title.startsWith(term.term)) {
                        weight_1 += term.weight * 32;
                    }
                });
                weight_1 += checkTerms(terms, 1, item.content);
                weight_1 += checkTerms(terms, 2, item.description);
                weight_1 += checkTerms(terms, 2, item.summary);
                weight_1 += checkTerms(terms, 2, item.subtitle);
                item.tags.forEach(function (tag) {
                    weight_1 += checkTerms(terms, 4, tag);
                });
                weight_1 += checkTerms(terms, 16, item.title);
                if (weight_1) {
                    results.push({
                        weight: weight_1,
                        item: item
                    });
                }
            }
        });
        if (results.length) {
            var resultsMessage = results.length + " sonuç bulundu.";
            if (results.length > limit) {
                resultsMessage += " İlk " + limit + " sonuç gösteriliyor.";
            }
            $("#results").html("<p>" + resultsMessage + "</p>");
            render(results);
        }
        else {
            $("#results").html('<h2>Sonuç Bulunamadı</h2>');
        }
    };
    var runSearch = function () {
        if (searching) {
            return;
        }
        var term = normalize($("#searchBox").val()).trim();
        if (term === lastTerm) {
            return;
        }
        lastTerm = term;
        if (term.length < minChars) {
            $("#results").html('<p class=\"text-center\">Anahtar kelimenin tamamını girin</p>'); // solda <p>No items found.</p> bu vardı
            $("#btnGo").attr("disabled", true);
            return;
        }
        $("#btnGo").removeAttr("disabled");
        searching = true;
        var startSearch = new Date();
        $("#results").html('<p>Processing search...</p>');
        var terms = term.split(" ");
        var termsTree = [];
        for (var i = 0; i < terms.length; i += 1) {
            for (var j = i; j < terms.length; j += 1) {
                var weight = Math.pow(2, j - i);
                var str = "";
                for (var k = i; k <= j; k += 1) {
                    str += (terms[k] + " ");
                }
                var newTerm = str.trim();
                if (newTerm.length >= minChars && stopwords.indexOf(newTerm) < 0) {
                    termsTree.push({
                        weight: weight,
                        term: " " + str.trim() + " "
                    });
                }
            }
        }
        search(termsTree);
        searching = false;
        var endSearch = new Date();
        $("#results").append("<p><small>Arama " + (endSearch - startSearch) + "ms. sürdü</small></p>");
    };
    var initSearch = function () {
        $("#searchBox").keyup(function () {
            runSearch();
        });
        $("#btnGo").click(function () {
            runSearch();
            var loc = window.location.href.split("#")[0];
            loc = loc + "#" + "resultsArea";
            window.location.href = loc;
        });
        runSearch();
    };
    $("#searchBox").hide();
    $("#btnGo").hide();
    var searchHost = {};
    $.getJSON("/index.json", function (results) {
        searchHost.index = [];
        var dup = {};
        results.forEach(function (result) {
            if (result.tags && !dup[result.permalink]) {
                var res = {};
                res.showTitle = result.title;
                res.showDescription = result.description;
                res.showSummary = result.summary;
                res.title = normalize(result.title);
                res.subtitle = normalize(result.subtitle);
                res.description = normalize(result.description);
                res.summary = normalize(result.summary);
                res.content = normalize(result.content);
                var newTags_1 = [];
                result.tags.forEach(function (tag) {
                    return newTags_1.push(normalize(tag));
                });
                res.tags = newTags_1;
                res.permalink = result.permalink;
                res.image = result.image;
                searchHost.index.push(res);
                dup[result.permalink] = true;
            }
        });
        $("#loading").hide();
        $("#btnGo").show();
        $("#searchBox").show()
            .removeAttr("disabled")
            .focus();
        initSearch();
    });
};
window.addEventListener("DOMContentLoaded", searchFn);