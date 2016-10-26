<raw>
    <span></span>

    <script>
        // on mount function
        this.on ('mount update', () => {
            // set raw inner html
            this.root.innerHTML = opts.html;
        });
    </script>
</raw>
