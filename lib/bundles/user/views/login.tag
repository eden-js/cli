<login-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 offset-md-4 mt-3">
        <div class="card card-default">
          <h4 class="card-header text-xs-center">
            Login
          </h4>
          <div class="card-block">
            <form accept-charset="UTF-8" role="form" method="post" action="/login">
              <div class="form-group">
                <input class="form-control" placeholder="Username" name="username" type="text" value={ opts.old ? opts.old.username : '' }>
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Email" name="email" type="email" value={ opts.old ? opts.old.email : '' }>
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password" name="password" type="password">
              </div>
              <button class="btn btn-success btn-block" type="submit">
                Login
              </button>
              <a class="btn btn-primary btn-block" href="/register">
                No account?
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</login-page>
