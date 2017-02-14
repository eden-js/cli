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
  <div class="card mt-4" if={ opts.usr.id }>
    <div class="card-header">
      Send Alert
    </div>
    <div class="card-block">
      <div class="form-group">
        <label for="type">Type</label>
        <select name="type" class="form-control">
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div class="form-group">
        <label for="username">Text</label>
        <input type="text" class="form-control" name="text" id="text" aria-describedby="text" placeholder="Enter text">
      </div>
    </div>
    <div class="card-footer">
      <button class="btn btn-primary" onclick={ onAlert }>Send</button>
    </div>
  </div>

  <script>

    /**
     * on alert function
     *
     * @param {Event} e
     */
    onAlert (e) {
      // prevent default
      e.preventDefault ();
      e.stopPropagation ();

      // get type
      let type = jQuery ('select[name="type"]', this.root).val ();
      let text = jQuery ('input[name="text"]', this.root).val ();

      // emit to socket
      socket.emit ('user.alert', {
        'id'   : opts.usr.id,
        'type' : type,
        'text' : text
      });
    }
  </script>
</user-admin-update-page>
