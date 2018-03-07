<register-page>
  <div class="container">
    <div class="row">
      <div class="col-md-4 mx-auto mt-3">
        <form accept-charset="UTF-8" role="form" method="post" action="/register" class="card card-default">
          <div class="card-header">
            Register
          </div>
          <div class="card-body">
            <input type="hidden" if={ opts.redirect } value={ opts.redirect } name="redirect" />
            <div class="form-group">
              <input class="form-control" placeholder="Username" name="username" type="text" value={ opts.old ? opts.old.username : '' } autocomplete="username">
            </div>
            <div class="form-group">
              <input class="form-control" placeholder="Email" name="email" type="email" value={ opts.old ? opts.old.email : '' } autocomplete="email">
            </div>
            <div class="form-group">
              <input class="form-control" placeholder="Password" name="password" type="password" autocomplete="new-password">
            </div>
            <div class="form-group">
              <input class="form-control" placeholder="Password Again" name="passwordb" type="password" autocomplete="new-password">
            </div>
            <button class="btn btn-success btn-block" type="submit">
              Register
            </button>
            <a class="btn btn-primary btn-block" href="/login{ opts.redirect ? '?url=' + opts.redirect : '' }">
              Already have an account?
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</register-page>
