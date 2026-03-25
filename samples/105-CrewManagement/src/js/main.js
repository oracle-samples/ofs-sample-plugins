/**
 * @license
 * Copyright (c) 2014, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
'use strict';
// /** Load the application's entry point file */
//require(['root','resources/translations-bundle']);

/**
 * Example of Require.js boostrap javascript
 */


(function () {
    // The "oj_whenReady" global variable enables a strategy that the busy context whenReady,
    // will implicitly add a busy state, until the application calls applicationBootstrapComplete
    // on the busy state context.
    window["oj_whenReady"] = true;
    document.getElementsByTagName("html")[0].setAttribute('lang',window.localStorage.getItem('lang')||'en');
    requirejs.config(
    {
      baseUrl: 'js',

      paths:
      /* DO NOT MODIFY
      ** All paths are dynamicaly generated from the path_mappings.json file.
      ** Add any new library dependencies in path_mappings json file
      */
      // injector:mainReleasePaths
      {
        'ojs': 'libs/oj/15.1.0/debug',
        'ojL10n': 'libs/oj/15.1.0/ojL10n',
        'ojtranslations': 'libs/oj/15.1.0/resources',
          'knockout': 'libs/knockout/knockout-3.5.1.debug',
  'jquery': 'libs/jquery/jquery-3.6.4',
  'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.13.2',
  'text': 'libs/require/text',
  'hammerjs': 'libs/hammer/hammer-2.0.8',
  'signals': 'libs/js-signals/signals',
  'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.2',
  'css': 'libs/require-css/css.min',
  'css-builder': 'libs/require-css/css-builder',
  'normalize': 'libs/require-css/normalize',
  '@oracle/oraclejet-preact': 'libs/oraclejet-preact/amd',
  'preact': 'libs/preact/dist/preact.umd',
  'preact/hooks': 'libs/preact/hooks/dist/hooks.umd',
  'preact/compat': 'libs/preact/compat/dist/compat.umd',
  'preact/jsx-runtime': 'libs/preact/jsx-runtime/dist/jsxRuntime.umd',
  'proj4': 'libs/proj4js/dist/proj4-src',
  'touchr': 'libs/touchr/touchr'
  ,
        'persist': 'libs/persist/debug',
        'chai': 'libs/chai/chai-4.3.7'
      }
      // endinjector
     ,config: {
        ojL10n: {
          merge: {
            'ojtranslations/nls/ojtranslations': 'resources/nls/translations',
          },
        }
      }

    }
  );
}());

/**
 * Load the application's entry point file
 */
require(['root','resources/translations-bundle']);
