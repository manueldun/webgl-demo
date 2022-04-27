function getStringFile(path, fileName) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", window.location.href + path + fileName, true);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText,
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText,
            });
        };
        xhr.send();
    });
}
function getBinaryFile(path, fileName, onProgress) {
    return new Promise((resolve, reject) => {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", window.location.href + path + fileName, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                resolve(oReq.response);
            }
        };
        oReq.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText,
            });
        };
        oReq.onprogress = onProgress;
        oReq.send(null);
    });
}

Image.prototype.completedPercentage = 0;
function loadImage(path, fileName, onProgress) {
    return new Promise((resolve, reject) => {
        Image.prototype.load = function (url, callback) {
            var thisImg = this,
                xmlHTTP = new XMLHttpRequest();

            thisImg.completedPercentage = 0;

            xmlHTTP.open("GET", url, true);
            xmlHTTP.responseType = "arraybuffer";

            xmlHTTP.onload = function (e) {
                var h = xmlHTTP.getAllResponseHeaders(),
                    m = h.match(/^Content-Type\:\s*(.*?)$/im),
                    mimeType = m[1] || "image/png";
                // Remove your progress bar or whatever here. Load is done.

                var blob = new Blob([this.response], { type: mimeType });
                thisImg.src = window.URL.createObjectURL(blob);
                if (callback) callback(this);
            };

            xmlHTTP.onprogress = onProgress;

            xmlHTTP.onloadstart = function () {
                // Display your progress bar here, starting at 0
                thisImg.completedPercentage = 0;
            };

            xmlHTTP.onloadend = function () {
                // You can also remove your progress bar here, if you like.
                thisImg.completedPercentage = 100;
            };

            xmlHTTP.send();
        };
        var img = new Image();
        img.load(window.location.href + path + fileName);

        img.onload = () => resolve(img);
    });
}
