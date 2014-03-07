#!/bin/bash
cat header.html
echo "<table>"
git ls-files \*.xml \*.xls \*.xlsb \*.xlsm \*.xlsx | while read x; do 
	y=$(node -pe 'encodeURIComponent("'"$x"'")')
	echo "$y">&2
	echo "<tr><td><a href='$y'>$x</a></td>"
	echo '<td><a href="../reflector.html?file=test_files/'"$y"'&fmt=html">HTML</a></td>'
	echo '<td><a href="../reflector.html?file=test_files/'"$y"'&fmt=csv">CSV</a></td>'
	echo '<td><a href="../reflector.html?file=test_files/'"$y"'&fmt=tsv">TSV</a></td>'
	echo '<td><a href="../reflector.html?file=test_files/'"$y"'&fmt=json">JSON</a></td>'
	echo "</tr>"
done
echo "</table>"
cat footer.html
