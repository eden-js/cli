<user-admin-update-page>
  <form method="post" action="/admin/user/{ opts.usr && opts.usr.id ? (opts.usr.id + '/update') : 'create' }">
    <div class="card">
      <div class="card-header">
        <strong>{ opts.usr && opts.usr.id ? 'Update' : 'Add' } User</strong>
        <p class="mb-0">{ opts.usr.username || opts.usr.email || '' }</p>
      </div>
      <div class="card-block">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" class="form-control" name="username" id="username" aria-describedby="username" placeholder="Enter username" value={ opts.usr.username }>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" class="form-control" name="email" id="email" aria-describedby="email" placeholder="Enter email" value={ opts.usr.email }>
        </div>
        <div class="form-group">
          <label for="name">Password</label>
          <input type="password" class="form-control" name="password" id="password" aria-describedby="password" placeholder="Enter Password">
        </div>
        <div class="form-group">
          <label for="roles">Roles</label>
          <select name="roles" id="roles" class="form-control" aria-describedby="roles" multiple="true">
            <option each={ acl, i in opts.acls } value={ acl.id } selected={ acl.has }>{ acl.name }</option>
          </select>
        </div>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </div>
  </form>
</user-admin-update-page>
