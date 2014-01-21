'use strict';
angular.module('jsonrpc', ['uuid']).provider('jsonrpc', function () {
  var defaults = this.defaults = {};
  defaults.basePath = '/rpc';
  this.$get = [
    '$http',
    'uuid4',
    function ($http, uuid4) {
      function jsonrpc(options, config) {
        var id = uuid4.generate();
        var payload = {
            jsonrpc: '2.0',
            method: options.method,
            id: id
          };
        if (angular.isDefined(options.data)) {
          payload.params = options.data;
        }
        var transforms = [];
        angular.forEach($http.defaults.transformResponse, function (t) {
          transforms.push(t);
        });
        transforms.push(function (data) {
          return data.id === id ? data.result || data.error : null;
        });
        config = config || {};
        var configTransforms = config.transformResponse;
        if (angular.isArray(configTransforms)) {
          [].push.apply(transforms, configTransforms);
        } else if (angular.isFunction(configTransforms)) {
          transforms.push(configTransforms);
        }
        config.transformResponse = transforms;
        return $http.post(options.path || defaults.basePath, payload, config);
      }
      jsonrpc.request = function (path, method, data, config) {
        if (arguments.length < 4) {
          config = data;
          data = method;
          method = path;
          path = null;
        }
        return jsonrpc({
          path: path,
          method: method,
          data: data
        }, config);
      };
      function Service(name, path) {
        this.serviceName = name;
        this.path = path;
      }
      Service.prototype.createMethod = function (name, config) {
        var path = this.path;
        var method;
        if (this.serviceName) {
          method = this.serviceName + '.' + name;
        } else {
          method = name;
        }
        return function (data) {
          return jsonrpc.request(path, method, data, config);
        };
      };
      jsonrpc.newService = function (name, path) {
        return new Service(name, path);
      };
      return jsonrpc;
    }
  ];
  this.setBasePath = function (path) {
    this.defaults.basePath = path;
    return this;
  };
});