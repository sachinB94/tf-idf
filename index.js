exports.tfidf = function (path, searchTerm, callback) {
	searchTerm = searchTerm.replace(/[.,?!;()"'-]/g, " ").replace(/\s+/g, " ").toLowerCase().split(" ");
	getRank(path, searchTerm, function (err, tfRank, nFiles, nPresent) {
		if (!err) {
			getIdf (nFiles, nPresent, function (idf) {
				getTfIdf(tfRank, idf, function (docRank) {
					callback(null, docRank);
				}); 
			});
		} else {
			callback(err, null);
		}
	});
	
}

function getRank (path, searchTerm, callback) {
	var fs = require('fs');
	var tfRank = new Array();
	var nPresent = 0;
	var nFiles = 0;
	fs.readdir(path , function (err, files) {
		if (!err) {
			files.filter (function (file) {
				return file.substr(-4) === '.txt';
			}).forEach (function (file, index, array) {
				fs.readFile(path + '/' + file, function (err, rawData) { 
					if (!err) {
						nFiles++;
						getObject(rawData, function (doc) {
							getTf(doc, searchTerm, nPresent, function (tf, nPresentNew) {
								nPresent = nPresentNew;
								tfRank.push({ 'file': file, 'tf': tf});
								if (index === array.length - 1) {
									callback (null, tfRank, nFiles, nPresent);
								}
							});
						});
					} else {
						callback(err, null, null, null);
					}
				});
			});
		} else {
			callback(err, null, null, null, null);
		}
	});
}

function getObject (rawData, callback) {
	rawData = rawData.toString();
	var index = {},
	words = rawData.replace(/[.,?!;()"'-]/g, " ").replace(/\s+/g, " ").toLowerCase().split(" ");

	words.forEach(function (word) {
		if (!(index.hasOwnProperty(word))) {
			index[word] = 0;
		}
		index[word]++;
	});

	callback(index);
}

function getTf (doc, searchTerm, nPresent, callback) {
	var success;
	var termPresent;
	var frequency = 0;
	var maxVal = 0;
	for (var word in doc) {
		if (maxVal < doc[word]) {
			maxVal = doc[word];
		}
	}
	termPresent = 0;
	frequency = 0;
	for (var j=0 ; j<searchTerm.length ; ++j) {
		success = false;
		for (var word in doc) {
			if (word === searchTerm[j]) {
				success = true;
				frequency += doc[word];
			}
		}
		if (success === true) {
			termPresent++;
		}
	}
	tf = 0.5 + (0.5 * frequency)/maxVal;
	if (termPresent === searchTerm.length) {
		nPresent++;
	}
	callback(tf, nPresent);
}

function getIdf (nFiles, nPresent, callback) {
	var idf = nFiles/(1+nPresent);
	callback(idf);
}

function getTfIdf(tfRank, idf, callback) {
	var docRank = new Array();
	tfRank.forEach( function (instance) {
		docRank.push({ 'file': instance.file, 'tfidf': instance.tf * idf });
	});
	callback(docRank);
}