<?php

$srcfile = preg_replace('/[^a-zA-Z0-9_\-\.\ \/]/', '', isset($_GET['src']) ? $_GET['src'] : "common.jscad");
$srcfile = preg_replace('/\.\./', '', $srcfile);

?>
<style type='text/css'>
body {
    margin: 0;
}
</style>
<link rel="stylesheet" href="/highlight/styles/railscasts.css" />
<script src="/highlight/highlight.pack.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<pre><code style="min-height:100%" class="javascript"><?php readfile($srcfile); ?></code></pre>
