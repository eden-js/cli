<login-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 mx-auto mt-3">
        <div class="card card-default">
          <div class="card-header">
            Login
          </div>
          <div class="card-body">
            <form accept-charset="UTF-8" role="form" method="post" action="/login">
              <input type="hidden" if={ opts.redirect } value={ opts.redirect } name="redirect" />
              <div class="form-group">
                <input class="form-control" placeholder="Username / Email" name="username" type="text" value={ opts.old ? opts.old.username : '' }>
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password" name="password" type="password">
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Login
              </button>
              <a class="btn btn-primary btn-block" href="/register{ opts.redirect ? '?redirect=' + opts.redirect : '' }">
                No account?
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</login-page>
