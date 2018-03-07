<forgot-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 offset-md-4 mt-3">
        <div class="card card-default">
          <h4 class="card-header text-xs-center">
            Forgot Password
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="post" action="/forgot">
              <div class="form-group">
                <input class="form-control" placeholder="Username" name="username" type="text" value={ opts.old ? opts.old.username : '' }>
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Submit
              </button>
            </form>
          </div>
        </div>
        <div class="card card-default">
          <h4 class="card-header text-xs-center">
            Received Token
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="get" action="/forgot">
              <div class="form-group">
                <input class="form-control" placeholder="Token" name="token" type="text" value={ opts.old ? opts.old.username : '' }>
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</forgot-page>
