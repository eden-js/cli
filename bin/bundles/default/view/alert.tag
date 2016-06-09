<alert>
    <div class="alert alert-danger" role="alert" if={ opts.error }>
        <span class="fa fa-alert" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        { opts.error }
    </div>
    <div class="alert alert-success" role="alert" if={ opts.success }>
        <span class="fa fa-alert" aria-hidden="true"></span>
        <span class="sr-only">Success:</span>
        { opts.success }
    </div>
</alert>
