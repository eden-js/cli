<error-page>
  <div class="error-page">
    <div class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error!</h4>

      <hr if={ opts.message }>

      <p if={ opts.message }>
        <b>{ opts.message }</b>
      </p>

      <p if={ opts.trace }>
        <div each={ line, i in opts.trace } class="ml-2">{ line }</div>
      </p>
    </div>
  </div>
</error-page>
