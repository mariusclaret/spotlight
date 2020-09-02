firebase.initializeApp({
    apiKey: "AIzaSyADm0cXoWcLLay-Tr7FlAEK_bCIwrHaJv4",
    authDomain: "spotlight-4d126.firebaseapp.com",
    databaseURL: "https://spotlight-4d126.firebaseio.com",
    projectId: "spotlight-4d126",
    storageBucket: "spotlight-4d126.appspot.com",
    messagingSenderId: "611970133528"
});

let creator;
let scroll = {};

const tmdb_image = "https://image.tmdb.org/t/p/w";
const database = firebase.database();
const messaging = firebase.messaging();

const categories = {
    "Upcoming Movies": "/movie/upcoming",
    "Now Playing Movies": "/movie/now_playing",
    "Now Playing Series": "/tv/on_the_air",
    "Popular Movies": "/movie/popular",
    "Popular Series": "/tv/popular",
    "Popular People": "/person/popular"
};

const preload = new Image();
preload.src = "/placeholder.png";

const storage = {
    get: function (key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    set: function (key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) { }
    },
    remove: function (key) {
        try {
            localStorage.removeItem(key);
        } catch (e) { }
    }
};

const snackbar = {
    element: document.getElementById("snack"),
    timeout: undefined,
    show: function (message) {
        snackbar.element.innerHTML = message;
        snackbar.element.classList.add("active");
        clearTimeout(snackbar.timeout);
        snackbar.timeout = setTimeout(function () {
            snackbar.element.classList.remove("active");
        }, 1600);
    }
};

function formatDate(date) {
    return parseInt(date.slice(8, 10), 10) + " " + ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(date.slice(5, 7), 10) - 1] + " " + date.slice(0, 4);
}

let position = 0;

document.getElementById("content").onscroll = function () {
    const top = document.getElementById("content").scrollTop;
    document.getElementById("search").className = (top >= 120 && top > position) ? "active" : "";
    position = top;
};

document.getElementById("twitter").onclick = function () {
    window.open("https://twitter.com/mariusclaret");
};

document.getElementById("tmdb").onclick = function () {
    window.open("https://www.themoviedb.org/");
};

function tmdb(reference, parameters, caching) {
    parameters = parameters || "";
    return new Promise(function (resolve, reject) {
        fetch("https://api.themoviedb.org/3" + reference + "?api_key=600fc3928355dd5e8c24ab192bb95cf1" + parameters)
            .then(function (value) {
                return value.json();
            })
            .then(function (value) {
                if (caching) storage.set(reference, JSON.stringify(value));
                resolve(value);
            })
            .catch(function (error) {
                const cache = storage.get(reference);
                if (cache) {
                    resolve(JSON.parse(cache));
                } else {
                    reject();
                }
            });
    });
}

function renderItem(parent, type, data) {
    if (!type) type = data.media_type.charAt(0).toUpperCase();

    const item = document.createElement("span");
    item.className = "media_item";
    item.onclick = function () {
        window.location.hash = type + data.id;
    };

    const icon = document.createElement("img");
    icon.onerror = function () {
        icon.onerror = null;
        icon.src = "/placeholder.png";
    }
    icon.src = (data.poster_path || data.profile_path) ? tmdb_image + 185 + (data.poster_path || data.profile_path) : "/placeholder.png";
    item.appendChild(icon);

    creator = document.createElement("span");
    creator.innerText = data.title || data.name || "";
    item.appendChild(creator);

    parent.appendChild(item);
}

Object.keys(categories).forEach(function (category) {
    const key = category.replace(/ /g, "_").toLowerCase();
    const parent = document.getElementById(key + "_media");
    document.getElementById(key + "_title").innerText = category;

    tmdb(categories[category], null, true).then(function (value) {
        value = value.results;

        const type = categories[category].charAt(1).toUpperCase();

        for (let counter = 0; counter < value.length; counter++) {
            renderItem(parent, type, value[counter]);
        }
    });
});

document.getElementById("random_action").onclick = function () {
    const year = Math.floor(Math.random() * (2017 - 1980 + 1) + 1980);

    document.getElementById("random_intro_year").innerText = year;

    tmdb("/discover/movie", "&primary_release_year=" + year, true).then(function (value) {
        value = value.results;

        const parent = document.getElementById("random");

        while (parent.lastChild.id !== "random_intro") {
            parent.removeChild(parent.lastChild);
        }

        for (let counter = 0; counter < 10; counter++) {
            const item = document.createElement("div");
            item.className = "random";
            item.onclick = function () {
                window.location.hash = "M" + value[counter].id;
            };

            const image = document.createElement("img");
            image.onerror = function () {
                image.onerror = null;
                image.src = "/placeholder.png";
            }
            image.src = tmdb_image + 500 + value[counter].backdrop_path;
            item.appendChild(image);

            creator = document.createElement("div");
            creator.innerHTML = value[counter].title + "<br><span>" + formatDate(value[counter].release_date) + "</span>";
            item.appendChild(creator);

            parent.appendChild(item);
        }

        setTimeout(function () {
            document.getElementById("random").scrollLeft = document.getElementById("random_intro").clientWidth + 16;
        }, 320);
    });
};

document.getElementById("random_action").onclick();

document.getElementById("search_input").oninput = function () {
    const query = document.getElementById("search_input").value.trim().replace(/\s\s+/g, " ");
    const search_title = document.getElementById("search_title");
    const search_media = document.getElementById("search_media");

    document.getElementById("search_clear").style.display = (query.length > 0) ? "block" : "none";
    search_title.style.display = (query.length > 0) ? "block" : "none";
    search_media.style.display = (query.length > 0) ? "block" : "none";
    document.getElementById("content").scrollTop = 0;

    if (query.startsWith("$")) {
        if (query.length === 5) {
            storage.set("$", query.substring(1));
        } else {
            storage.remove("$");
        }
    }

    if (query.length > 0) {
        tmdb("/search/multi", "&include_adult=true&query=" + query, false).then(function (value) {
            document.getElementById("search_title").innerText = "Search results for \"" + query + "\"";
            value = value.results;
            while (search_media.firstChild) search_media.removeChild(search_media.firstChild);

            for (let counter = 0; counter < value.length; counter++) {
                renderItem(search_media, null, value[counter]);
            }

            search_media.scrollLeft = 0;
        });
    } else {
        while (search_media.firstChild) search_media.removeChild(search_media.firstChild);
    }
};

document.getElementById("search_clear").onclick = function () {
    document.getElementById("search_input").value = "";
    document.getElementById("search_input").oninput();
    document.getElementById("search_input").focus();
};

function expand(hash, type, id) {
    const parent = document.getElementById("expand");
    const promises = [];

    let general, images, media_1, media_2, reference_1, reference_2, title_1, title_2, type_1, type_2;

    if (type === "movie") {
        reference_1 = "/movie/" + id + "/credits";
        reference_2 = "/movie/" + id + "/recommendations";
        title_1 = "Movie Cast";
        title_2 = "Recommendations";
        type_1 = "P";
        type_2 = "M";
    }

    if (type === "tv") {
        reference_1 = "/tv/" + id + "/credits";
        reference_2 = "/tv/" + id + "/recommendations";
        title_1 = "Series Cast";
        title_2 = "Recommendations";
        type_1 = "P";
        type_2 = "T";
    }

    if (type === "person") {
        reference_1 = "/person/" + id + "/movie_credits";
        reference_2 = "/person/" + id + "/tv_credits";
        title_1 = "Movie Credits";
        title_2 = "Series Credits";
        type_1 = "M";
        type_2 = "T";
    }

    while (parent.firstChild) parent.removeChild(parent.firstChild);

    promises.push(tmdb("/" + type + "/" + id, null, false).then(value => general = value));
    promises.push(tmdb("/" + type + "/" + id + "/images", null, false).then(value => images = value.backdrops || value.profiles));
    promises.push(tmdb(reference_1, null, false).then(value => media_1 = value.results || value.cast));
    promises.push(tmdb(reference_2, null, false).then(value => media_2 = value.results || value.cast));
    promises.push(new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, 360);
    }));

    Promise.all(promises).then(function () {
        while (parent.firstChild) parent.removeChild(parent.firstChild);
        parent.appendChild(document.importNode(document.querySelector("#expand_template").content, true));

        document.getElementById("expand_close").onclick = function () {
            window.history.back();
        };

        document.getElementById("expand_share").onclick = function () {
            if (storage.get("$")) {
                window.open("https://us-central1-spotlight-4d126.cloudfunctions.net/notification?hash=" + hash + "&auth=" + storage.get("$"));
                return;
            }

            if (navigator.share !== undefined) {
                navigator.share({
                    title: general.name,
                    url: window.location.href
                });
                return;
            }
            try {
                const copy = document.createElement("input");
                copy.value = window.location.href;
                document.body.appendChild(copy);
                copy.select();
                document.execCommand("copy");
                document.body.removeChild(copy);
                snackbar.show("Link copied to clipboard!");
            } catch (e) {
                prompt("Copy this link:", window.location.href);
            }
        };

        let time;
        if (general.release_date) {
            time = "(" + formatDate(general.release_date) + ")";
        } else if (general.first_air_date && general.last_air_date) {
            time = "(" + general.first_air_date.substring(0, 4) + " - " + general.last_air_date.substring(0, 4) + ")";
        } else if (general.first_air_date) {
            time = "(Since " + formatDate(general.first_air_date) + ")";
        } else if (general.birthday && general.deathday) {
            time = "(" + formatDate(general.birthday) + " - " + formatDate(general.deathday) + ")";
        } else if (general.birthday) {
            time = "(" + formatDate(general.birthday) + ")";
        }

        document.getElementById("expand_backdrop").onerror = function () {
            document.getElementById("expand_backdrop").onerror = null;
            document.getElementById("expand_backdrop").src = "/placeholder.png";
        }

        document.getElementById("expand_poster").onerror = function () {
            document.getElementById("expand_poster").onerror = null;
            document.getElementById("expand_poster").src = "/placeholder.png";
        }

        document.getElementById("expand_backdrop").src = tmdb_image + 780 + (general.poster_path || general.profile_path);
        document.getElementById("expand_poster").src = tmdb_image + 185 + (general.poster_path || general.profile_path);
        document.getElementById("expand_name").innerText = (general.title || general.name) + " " + (time || "");
        document.getElementById("expand_share").innerText = storage.get("$") ? "Push notification" : "Share";
        document.getElementById("expand_description").innerText = (general.overview || general.biography || "Overview not available.").replace(/&amp;/g, "&").replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|").slice(0, 3).join(" ");
        document.getElementById("expand_title_1").innerText = title_1;
        document.getElementById("expand_title_2").innerText = title_2;

        const expand_images = document.getElementById("expand_images");
        const expand_media_1 = document.getElementById("expand_media_1");
        const expand_media_2 = document.getElementById("expand_media_2");

        for (let counter = 0; counter < Math.min(images.length, 10); counter++) {
            if (!images[counter].iso_639_1) {
                const image = document.createElement("img");

                image.onerror = function () {
                    image.onerror = null;
                    image.src = "/placeholder.png";
                }

                image.style.width = 240 * images[counter].aspect_ratio + "px";
                image.src = tmdb_image + 780 + images[counter].file_path;
                expand_images.appendChild(image);
            }
        }

        for (let counter = 0; counter < Math.min(media_1.length, 20); counter++) {
            renderItem(expand_media_1, type_1, media_1[counter]);
        }

        for (let counter = 0; counter < Math.min(media_2.length, 20); counter++) {
            renderItem(expand_media_2, type_2, media_2[counter]);
        }

        if (scroll[hash]) {
            parent.scrollTop = scroll[hash].parent;
            expand_media_1.scrollLeft = scroll[hash].media_1;
            expand_media_2.scrollLeft = scroll[hash].media_2;
        } else {
            parent.scrollTop = parent.clientHeight - 152;
        }
    }).catch(function () {
        window.history.back();
        snackbar.show("No internet connection!");
    });
}

let current;

window.onhashchange = function () {
    let type = window.location.hash.charAt(1);
    const id = window.location.hash.substring(2);

    document.getElementById("blocker").classList.remove("active");
    document.getElementById("expand").classList.remove("active");

    if (current && document.getElementById("expand_backdrop")) {
        scroll[current] = {
            parent: document.getElementById("expand").scrollTop,
            media_1: document.getElementById("expand_media_1").scrollLeft,
            media_2: document.getElementById("expand_media_2").scrollLeft
        };
    }

    if ((type === "M" || type === "T" || type === "P") && Number.isInteger(parseInt(id))) {
        if (type === "M") type = "movie";
        if (type === "T") type = "tv";
        if (type === "P") type = "person";

        expand(window.location.hash.substring(1), type, id);
        document.getElementById("blocker").classList.add("active");
        document.getElementById("expand").classList.add("active");
    } else {
        scroll = {};
    }

    current = window.location.hash.substring(1);
}

const hash = window.location.hash;

if (hash.length > 1) {
    window.location.hash = "";
    setTimeout(function () {
        window.location.hash = hash;
    }, 800);
} else {
    window.onhashchange();
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/worker.js").then(function (worker) {
        messaging.useServiceWorker(worker);
        messaging.getToken().then(function (token) {
            if (token) database.ref("tokens").child(token).set(true);
        });

        messaging.onTokenRefresh(function () {
            messaging.getToken().then(function (token) {
                if (token) database.ref("tokens").child(token).set(true);
            });
        });
    });
}

(function (i, s, o, g, r, a, m) {
    i["GoogleAnalyticsObject"] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o), m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");

ga("create", "UA-90346701-1", "auto");
ga("set", "anonymizeIp", true);
ga("send", "pageview");