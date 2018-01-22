var octo = require('@octopusdeploy/octopackjs');
var path = require('path');

function OctoWebpackPlugin(options) {
    this.options = options || {};
}

OctoWebpackPlugin.prototype.apply = function (compiler) {
    var options = this.options;


    compiler.plugin('after-emit', function(compilation, callback) {
        var files = compilation.assets;
        
        var pkg = octo.pack(options.type, {id: options.id, version: options.version});

        function pushOptions(file) {
            return {
                apikey: options.apiKey,
                replace: !!options.replace,
                host: options.host,
                verbose: false,
                name: path.basename(file)
            };
        }

        function pushPackage(file) {
            octo.push(file, pushOptions(file), pushComplete);
        }

        function pushComplete(err, data) {
            if (err) {
                onFail(err);                
            } else {
                onSuccess(data);
            }
            callback();
        }

        function onFail(err) {
            var msg = err.statusMessage || err.statusCode;
            if (err && err.body && err.body.Errors && err.body.Errors[0]) {
                msg = err.body.Errors[0] + ' (' + err.statusCode + ')';
            }
            compilation.errors.push(new Error(msg));
        }

        function onSuccess(data) {
            console.log('Pushed package' + data.Title + ' v' + data.Version + ' (' + fileSizeString(data.PackageSizeBytes) + ') to ' + options.host);
        }    
        
        
        for (var name in compilation.assets) {            
            pkg.append(name, compilation.assets[name].existsAt);
        }

        pkg.toFile("./", function (error, data) {
            if (error) {
                compilation.errors.push(new Error(error))
                callback();
            } else {
                console.log('Packed \'' + data.name + '\' with ' + Object.keys(files).length + ' files');
                pushPackage(data.name);
            }
        });
    });
}

module.exports = OctoWebpackPlugin;