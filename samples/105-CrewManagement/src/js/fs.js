define('fs', [], function () {
  'use strict';

  return {
    readFileSync: function () {
      throw new Error('fs.readFileSync is not available in the browser runtime.');
    }
  };
});
