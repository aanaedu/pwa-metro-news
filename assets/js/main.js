window.onload = function () {
    var API_KEY = '90e1e2553d0d4856b626480e803ccdf3';
    var URL_CONSTANTS = {
        topHeadlines: 'https://newsapi.org/v2/top-headlines?country=COUNTRY_ID&apiKey=' + API_KEY,
        everything: 'https://newsapi.org/v2/everything?q=QUERY_STRING&apiKey=' + API_KEY,
        sources: 'https://newsapi.org/v2/sources?apiKey=' + API_KEY,
        topHeadlinesBySources: 'https://newsapi.org/v2/top-headlines?sources=SOURCE_ID&apiKey=' + API_KEY
    };

    var COUNTRY_CODES = {
        UnitedStates: 'us',
        Ghana: 'gh',
        Nigeria: 'ng',
        SouthAfrica: 'za',
        Canada: 'ca',
        UnitedKingdom: 'gb'
    };

    var source = document.getElementById("news-item-template").innerHTML;
    var template = Handlebars.compile(source);
    var context = {};

    // elements
    var category = document.getElementById("js-category");
    var country = document.getElementById("js-country");
    var sources$ = $("#js-sources");
    var newsContainer = document.getElementById('js-news-container');
    var loading$ = $('#js-loading');

    loading$.hide();

    // events
    category.addEventListener('change', function (e) {
        var selectedCategory = e.target.value;
        getArticleOptions(country.value, selectedCategory);
    });

    country.addEventListener('change', function (e) {
        var selectedCountry = e.target.value;
        getArticleOptions(selectedCountry, category.value);
    });


    var fetchJSONData = function (url) {
        loading$.show();
        return fetch(url)
            .then(res => res.json());
    }

    var getArticles = function () {
        fetchJSONData('data.json')
            .then(res => buildArticles(res))
            .catch(err => handleError('Error fetching news articles', err));
    }

    var getArticlesByCountry = function (countryId) {
        var url = URL_CONSTANTS.topHeadlines.replace('COUNTRY_ID', countryId);
        fetchJSONData(url)
            .then(res => buildArticles(res))
            .catch(err => handleError('Error fetching news articles by country', err));
    }

    var getArticlesBySource = function (sourceId) {
        var url = URL_CONSTANTS.topHeadlinesBySources.replace('SOURCE_ID', sourceId);
        fetchJSONData(url)
            .then(res => buildArticles(res))
            .catch(err => handleError('Error fetching news articles by source', err));
    }

    var getArticleOptions = function (countryId, category) {
        var url = URL_CONSTANTS.topHeadlines;
        sources$.val('');

        if (!countryId) {
            countryId = COUNTRY_CODES.Nigeria;
        }

        if (category) {
            url += '&category=' + category;
        }

        url = url.replace('COUNTRY_ID', countryId);

        fetchJSONData(url)
            .then(res => buildArticles(res))
            .catch(err => handleError('Error fetching news articles', err));
    }

    var buildArticles = function (res) {
        var html = '<p>Sorry no articles were found at this time :(. Please try again later.';
        loading$.hide();
        if (res.status === 'ok' && res.articles.length > 0) {
            db.deleteStaleData();
            res.articles.map((item, index) => {
                item.publishedAtDescription = moment(item.publishedAt, "YYYYMMDD").fromNow();
                item.id = utils.guid();
                db.writeNews(item);
            });
            context.articles = res.articles;
        } else if (res && res.length > 0) {
            context.articles = res;
        } else {
            context.articles = null;
        }

        html = template(context);
        newsContainer.innerHTML = html;
    }

    var initEasyAutocomplete = function () {
        var options = {
            url: URL_CONSTANTS.sources,
            listLocation: function (data) {
                return data.sources || [];
            },
            placeholder: 'Search available sources',
            getValue: function (element) {
                return element.name;
            },
            list: {
                match: {
                    enabled: true
                },
                onSelectItemEvent: function () {
                    var sourceId = sources$.getSelectedItemData().id;
                    // little delay to reduce calls
                    setTimeout(function () {
                        getArticlesBySource(sourceId);
                    }, 500);
                }
            },
            requestDelay: 500,
            theme: "square"
        };

        sources$.easyAutocomplete(options);
    }

    var showCachedNews = function () {
        db.readAllNews()
            .then(res => {
                if (res && res.length > 0) {
                    res = res.sort((a, b) => new Date(a.publishedAt).getTime() < new Date(b.publishedAt).getTime());
                    buildArticles(res);
                }
                getArticleOptions();
            })
    };

    var handleError = function (message, err) {
        loading$.hide();
        return console.error(message, err);
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js', {
                scope: '/'
            })
            .then(function (reg) {
                console.log('Registration succeeded. Scope is ' + reg.scope);
            })
            .catch(function (error) {
                console.log('Registration failed with ' + error);
            });
    }

    initEasyAutocomplete();
    showCachedNews();
}