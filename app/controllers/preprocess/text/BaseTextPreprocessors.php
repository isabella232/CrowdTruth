<?php
namespace Preprocess;

/**
 * DEVEL NOTE: 
 * 
 * New TextPreprocessor MUST extend AbstractTextPreprocessor AND MUST be registered 
 * in /vendor/composer/autoload_classmap.php for them to be available in the application level.
 * 
 * run php artisan dump-autoload
 * 
 */
// TODO: implement properly and document !
class TextToTypePreprocessor extends AbstractTextPreprocessor {
	function getName() {
		return 'Text as type';
	}

	function getParameterJSFunctionName() {
		return 'textToType';
	}

	function getParameterJSFunction() {
		return '<script src="/js/preprocessors/text/basetextpreprocessors.js"></script>';
	}

	function processItem($params, $data, $entities) {
		// Validate required parameters are present
		if(!array_key_exists('usecol', $params) ||
			!array_key_exists('as', $params)	) {
			return 'N/A';
		}
		$colName = $params['usecol'];
		$as = $params['as'];

		// Validate required columns are present
		if(! array_key_exists($colName, $data)) {
			return 'N/A';
		}

		$value = $data[$colName];
		$item = '';
		switch($as) {
			case 'text':
				$item = $value;
				break;
			case 'number':
				if(str_contains($value, '.')) {
					$item = (float) $value;
				} else {
					$item = (int) $value;
				}
				break;
			default:
				break;
		}
		return $item;
	}
}

class RegExpPreprocessor extends AbstractTextPreprocessor {
	function getName() {
		return 'Regular expression';
	}

	function getParameterJSFunctionName() {
		return 'regexPreprocessor';
	}

	function getParameterJSFunction() {
		return '<script src="/js/preprocessors/text/basetextpreprocessors.js"></script>';
	}

	function processItem($params, $data, $entities) {
		// Validate required parameters are present
		if(!array_key_exists('usecol', $params) || 
			!array_key_exists('regex', $params) || 
			!array_key_exists('replace', $params) ) {
			return 'N/A';
		}
		$colName = $params['usecol'];
		$regex = $params['regex'];
		$replace = $params['replace'];

		// Apply split if required.
		if(array_key_exists('regex_split', $params)) {
			$regex = explode(',',$regex);
		}
		if(array_key_exists('regex_split', $params) && array_key_exists('replace_split', $params)) {
			$replace = explode(',',$replace);
		}

		// Validate required columns are present
		if(! array_key_exists($colName, $data)) {
			return 'N/A';
		}
		$value = $data[$colName];

		// Apply upper / lower if required.	
		if(array_key_exists('uppercase', $params)) {
			$value = strtoupper($value);
		}
		if(array_key_exists('lowercase', $params)) {
			$value = strtolower($value);
		}
		
		try {
			$item = preg_replace ( $regex , $replace , $value);
		} catch(\ErrorException $e) {
			$item = '-- Invalid regular expression --';
		}
		
		return $item;
	}
}

class WordCountPreprocessor extends AbstractTextPreprocessor {
	function getName() {
		return 'Word count';
	}

	function getParameterJSFunctionName() {
		return 'wordcountPreprocessor';
	}

	function getParameterJSFunction() {
		return '<script src="/js/preprocessors/text/basetextpreprocessors.js"></script>';
	}

	function processItem($params, $data, $entities) {
		// Validate required parameters are present
		if(!array_key_exists('usecol', $params)) {
			return 'N/A';
		}
		$colName = $params['usecol'];
		
		// Validate required columns are present
		if(! array_key_exists($colName, $data)) {
			return 'N/A';
		}
		$value = $data[$colName];

		$words = explode(' ', $value);
		$item = count($words);
		return $item;
	}
}

class TermReplacePreprocessor extends AbstractTextPreprocessor {
	function getName() {
		return 'Replace term';
	}

	function getParameterJSFunctionName() {
		return 'replaceTermPreprocessor';
	}

	function getParameterJSFunction() {
		return '<script src="/js/preprocessors/text/basetextpreprocessors.js"></script>';
	}

	function processItem($params, $data, $entities) {
		// Validate required parameters are present
		if(!array_key_exists('repFrom', $params) || 
			!array_key_exists('repBy', $params)) {
			return 'N/A';
		}
		$repFrom = $params['repFrom'];
		$repBy   = $params['repBy'];

		try {
			// RepBy MUST be a group which contains a text & formatted properties
			$repFrom = $this->fetchValue($repFrom, $entities);
			$repBy   = $this->fetchValue($repBy, $entities);
			
			$text = $repBy['text'];
			$formatted = $repBy['formatted'];
			$item = str_replace($text, $formatted, $repFrom);
		} catch(\ErrorException $e) {
			$item = '--Replacement failed--';
		}

		return $item;
	}

	/**
	 * 
	 * @param unknown_type $valName   Key in format x_y_z
	 * @param unknown_type $entities  Array with keys in format entities[x][x_y][x_y_z]
	 */
	function fetchValue($valName, $entities) {
		$valKeys = explode('_', $valName);

		$value = $entities;
		$fullKey = '';
		foreach ($valKeys as $key) {
			$value = $value[$key];
		}
		return $value;
	}
}
